import 'dart:convert';
import 'dart:developer' as developer;

import '../../../core/env/app_env.dart';
import '../../../core/network/api_client.dart';
import 'content_models.dart';

class ContentRepository {
  ContentRepository({required this.apiClient, required this.env});

  final ApiClient apiClient;
  final AppEnv env;

  String _withCountry(String path, {String? profileId}) {
    final q = <String, String>{'country': 'NG'};
    if (profileId != null && profileId.isNotEmpty) q['profileId'] = profileId;
    final query = q.entries
        .map((e) =>
            '${Uri.encodeQueryComponent(e.key)}=${Uri.encodeQueryComponent(e.value)}')
        .join('&');
    return '$path?$query';
  }

  Future<List<MediaItem>> fetchTitles({String? profileId}) async {
    final response = await apiClient.get(
        '${env.apiBaseUrl}${_withCountry('/titles', profileId: profileId)}');
    if (response.statusCode >= 200 && response.statusCode < 300) {
      final json = jsonDecode(response.body) as Map<String, dynamic>;
      final titles = ((json['titles'] as List?) ?? const [])
          .whereType<Map<String, dynamic>>()
          .map(MediaItem.fromJson)
          .where((e) => e.id.isNotEmpty)
          .toList();
      if (titles.isNotEmpty) return titles;
    }

    // Fallback: web also consumes recommendations feeds; use them when catalog is empty.
    final recRes = await apiClient.get(
        '${env.apiBaseUrl}${_withCountry('/recs/for-you', profileId: profileId)}');
    if (recRes.statusCode < 200 || recRes.statusCode >= 300) {
      return const [];
    }
    final recJson = jsonDecode(recRes.body) as Map<String, dynamic>;
    final rawItems = ((recJson['items'] as List?) ?? const []);

    final extracted = <Map<String, dynamic>>[];
    for (final raw in rawItems) {
      if (raw is Map<String, dynamic>) {
        if (raw['title'] is Map<String, dynamic>) {
          extracted.add(raw['title'] as Map<String, dynamic>);
        } else {
          extracted.add(raw);
        }
      }
    }

    return extracted
        .map(MediaItem.fromJson)
        .where((e) => e.id.isNotEmpty)
        .toList();
  }

  Future<MediaItem> fetchTitleDetail(String id, {String? profileId}) async {
    final response = await apiClient.get(
        '${env.apiBaseUrl}${_withCountry('/titles/$id', profileId: profileId)}');
    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw Exception('Failed to fetch title detail (${response.statusCode})');
    }
    final json = jsonDecode(response.body) as Map<String, dynamic>;
    final payload = (json['title'] ?? json) as Map<String, dynamic>;
    return MediaItem.fromJson(payload);
  }

  Future<List<LiveEvent>> fetchLiveEvents({String? profileId}) async {
    final response = await apiClient.get(
        '${env.apiBaseUrl}${_withCountry('/live/events', profileId: profileId)}');
    if (response.statusCode < 200 || response.statusCode >= 300) {
      return const [];
    }
    final json = jsonDecode(response.body) as Map<String, dynamic>;
    return ((json['events'] as List?) ?? const [])
        .whereType<Map<String, dynamic>>()
        .map(LiveEvent.fromJson)
        .toList();
  }

  Future<LiveEngagementSnapshot> fetchLiveEngagementSnapshot(
      String eventId, {
      String? since,
    }) async {
    final suffix = (since != null && since.isNotEmpty)
        ? '?since=${Uri.encodeQueryComponent(since)}'
        : '';
    final response = await apiClient
        .get('${env.apiBaseUrl}/live/events/$eventId/engagement$suffix');
    if (response.statusCode < 200 || response.statusCode >= 300) {
      return LiveEngagementSnapshot(
        serverTime: null,
        messages: const [],
        reactionTotals: const [],
        recentReactions: const [],
      );
    }
    return LiveEngagementSnapshot.fromJson(
      jsonDecode(response.body) as Map<String, dynamic>,
    );
  }

  Future<LiveChatMessage?> sendLiveChatMessage(String eventId, String message) async {
    final response = await apiClient.post(
      '${env.apiBaseUrl}/live/events/$eventId/chat',
      body: jsonEncode({'message': message}),
    );
    if (response.statusCode < 200 || response.statusCode >= 300) {
      return null;
    }
    final json = jsonDecode(response.body) as Map<String, dynamic>;
    final payload = (json['message'] is Map<String, dynamic>)
        ? json['message'] as Map<String, dynamic>
        : json;
    return LiveChatMessage.fromJson(payload);
  }

  Future<void> sendLiveReaction(String eventId, String type) async {
    await apiClient.post(
      '${env.apiBaseUrl}/live/events/$eventId/reactions',
      body: jsonEncode({'type': type}),
    );
  }

  Future<void> reportEngagementEvent({
    required String eventType,
    required String titleId,
    String? episodeId,
    String? profileId,
    double? completionPercent,
    int? positionSec,
    int? durationSec,
  }) async {
    try {
      final payload = <String, dynamic>{
        'eventType': eventType,
        'titleId': titleId,
        'occurredAt': DateTime.now().toUtc().toIso8601String(),
        'country': 'NG',
      };
      if (episodeId != null && episodeId.isNotEmpty) payload['episodeId'] = episodeId;
      if (profileId != null && profileId.isNotEmpty) payload['profileId'] = profileId;
      final meta = <String, dynamic>{};
      if (completionPercent != null) meta['completionPercent'] = completionPercent;
      if (positionSec != null) meta['positionSec'] = positionSec;
      if (durationSec != null) meta['durationSec'] = durationSec;
      if (meta.isNotEmpty) payload['metadata'] = meta;
      await apiClient.post(
        '${env.apiBaseUrl}/events',
        body: jsonEncode({'events': [payload]}),
      );
    } catch (_) {}
  }

  Future<List<ContinueWatchingItem>> fetchContinueWatching(
      {String? profileId}) async {
    final endpoint =
        '${env.apiBaseUrl}${_withCountry('/recs/continue-watching', profileId: profileId)}';
    developer.log(
      'ContinueWatching request started (profileId=${profileId?.isNotEmpty == true ? 'set' : 'none'})',
      name: 'ContentRepository',
    );

    final response = await apiClient.get(endpoint);
    if (response.statusCode < 200 || response.statusCode >= 300) {
      developer.log(
        'ContinueWatching request failed (status=${response.statusCode})',
        name: 'ContentRepository',
      );
      return const [];
    }

    final json = jsonDecode(response.body) as Map<String, dynamic>;
    final rawItems = ((json['items'] as List?) ?? const []);

    int toEpochMillis(dynamic value) {
      if (value is num) return value.toInt();
      final text = value?.toString() ?? '';
      if (text.isEmpty) return 0;
      final asInt = int.tryParse(text);
      if (asInt != null) return asInt;
      return DateTime.tryParse(text)?.millisecondsSinceEpoch ?? 0;
    }

    int? readSeconds(Map<String, dynamic> raw, List<String> keys) {
      for (final key in keys) {
        final value = raw[key];
        if (value is int) return value;
        if (value is num) return value.round();
        final parsed = int.tryParse('${value ?? ''}');
        if (parsed != null) return parsed;
      }
      return null;
    }

    final tuples = <({Map<String, dynamic> raw, int sortTime, int index})>[];
    for (var i = 0; i < rawItems.length; i++) {
      final raw = rawItems[i];
      if (raw is! Map<String, dynamic>) continue;
      final sortTime = toEpochMillis(
        raw['lastWatchedAt'] ??
            raw['updatedAt'] ??
            raw['watchedAt'] ??
            raw['timestamp'] ??
            raw['lastPlayedAt'],
      );
      tuples.add((raw: raw, sortTime: sortTime, index: i));
    }

    tuples.sort((a, b) {
      final byTime = b.sortTime.compareTo(a.sortTime);
      if (byTime != 0) return byTime;
      return a.index.compareTo(b.index);
    });

    final seen = <String>{};
    final ordered = <ContinueWatchingItem>[];
    var skippedNoId = 0;
    var skippedDuplicate = 0;
    var skippedOutOfRange = 0;

    for (final tuple in tuples) {
      final parsed = ContinueWatchingItem.fromJson(tuple.raw);
      final nested = tuple.raw['title'];
      final nestedId = nested is Map<String, dynamic>
          ? (nested['id'] ?? nested['titleId'] ?? '').toString()
          : '';
      final id = [parsed.item.id, nestedId, tuple.raw['titleId'], tuple.raw['id']]
          .map((e) => e?.toString().trim() ?? '')
          .firstWhere((e) => e.isNotEmpty, orElse: () => '');

      if (id.isEmpty) {
        skippedNoId++;
        continue;
      }
      if (seen.contains(id)) {
        skippedDuplicate++;
        continue;
      }

      final durationSec = readSeconds(tuple.raw, const [
            'durationSeconds',
            'durationSec',
            'runtimeSeconds',
            'runtimeSec'
          ]) ??
          (nested is Map<String, dynamic>
              ? readSeconds(nested, const ['durationSeconds', 'runtimeSeconds'])
              : null);
      final progressSec = readSeconds(tuple.raw, const [
            'progressSeconds',
            'positionSeconds',
            'positionSec',
            'watchedSeconds',
            'currentTimeSec',
            'watchTimeSeconds'
          ]) ??
          (nested is Map<String, dynamic>
              ? readSeconds(nested, const ['progressSeconds', 'positionSeconds'])
              : null);

      final hasValidPercent =
          parsed.completionPercent > 0 && parsed.completionPercent < 1;
      final hasProgressSeconds =
          (progressSec != null && progressSec > 0) &&
              (durationSec == null || durationSec <= 0 || progressSec < durationSec);

      if (!hasValidPercent && !hasProgressSeconds) {
        skippedOutOfRange++;
        continue;
      }

      seen.add(id);
      ordered.add(parsed);
    }

    developer.log(
      'ContinueWatching mapped raw=${rawItems.length}, sorted=${tuples.length}, kept=${ordered.length}, skippedNoId=$skippedNoId, skippedDuplicate=$skippedDuplicate, skippedOutOfRange=$skippedOutOfRange',
      name: 'ContentRepository',
    );

    return ordered;
  }

  /// Purchased PPV titles ("My Tickets"). Mirrors the web's /ppv/my-titles.
  Future<List<PpvTicket>> fetchMyPpvTickets({String? profileId}) async {
    final query = (profileId != null && profileId.isNotEmpty)
        ? '?profileId=${Uri.encodeQueryComponent(profileId)}'
        : '';
    final response =
        await apiClient.get('${env.apiBaseUrl}/ppv/my-titles$query');
    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw Exception('Failed to fetch tickets (${response.statusCode})');
    }
    final json = jsonDecode(response.body) as Map<String, dynamic>;
    final purchases = ((json['activePurchases'] as List?) ?? const [])
        .whereType<Map<String, dynamic>>();
    return purchases
        .map(PpvTicket.fromPurchaseJson)
        .whereType<PpvTicket>()
        .toList();
  }

  Future<PpvAccess> fetchPpvAccess(String titleId) async {
    final response = await apiClient
        .get('${env.apiBaseUrl}/ppv/access/$titleId?record=false');
    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw Exception('Failed to check PPV access (${response.statusCode})');
    }
    return PpvAccess.fromJson(
        jsonDecode(response.body) as Map<String, dynamic>);
  }

  Future<Map<String, dynamic>> initiatePaystackPurchase(String titleId) async {
    final response = await apiClient.post(
      '${env.apiBaseUrl}/ppv/paystack/initiate',
      body: jsonEncode({'titleId': titleId, 'country': 'NG'}),
    );
    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw Exception('Failed to initiate payment (${response.statusCode})');
    }
    return jsonDecode(response.body) as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> verifyPaystackPurchase(String reference) async {
    final response = await apiClient.post(
      '${env.apiBaseUrl}/ppv/paystack/verify',
      body: jsonEncode({'reference': reference, 'trxref': reference}),
    );
    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw Exception('Failed to verify payment (${response.statusCode})');
    }
    return jsonDecode(response.body) as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> initiateFlutterwavePurchase(
      String titleId) async {
    final response = await apiClient.post(
      '${env.apiBaseUrl}/ppv/initiate',
      body: jsonEncode({'titleId': titleId, 'country': 'NG'}),
    );
    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw Exception(
          'Failed to initiate Flutterwave (${response.statusCode})');
    }
    return jsonDecode(response.body) as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> verifyFlutterwavePurchase(
      {String? txRef, String? transactionId}) async {
    final body = {
      if (txRef != null && txRef.isNotEmpty) 'txRef': txRef,
      if (txRef != null && txRef.isNotEmpty) 'tx_ref': txRef,
      if (transactionId != null && transactionId.isNotEmpty)
        'transactionId': transactionId,
      if (transactionId != null && transactionId.isNotEmpty)
        'transaction_id': transactionId,
    };

    final endpoints = [
      '${env.apiBaseUrl}/ppv/flutterwave/verify',
      '${env.apiBaseUrl}/ppv/verify',
    ];

    int? lastStatus;
    for (final endpoint in endpoints) {
      final response = await apiClient.post(endpoint, body: jsonEncode(body));
      lastStatus = response.statusCode;
      if (response.statusCode >= 200 && response.statusCode < 300) {
        return jsonDecode(response.body) as Map<String, dynamic>;
      }
    }

    throw Exception(
        'Failed to verify Flutterwave (${lastStatus ?? 'no response'})');
  }

  /// Starts an Apple In-App Purchase for a PPV title: creates a PENDING
  /// purchase row server-side and returns the StoreKit product id to buy.
  /// Mirrors initiatePaystackPurchase's shape.
  Future<Map<String, dynamic>> createIapIntent(String titleId) async {
    final response = await apiClient.post(
      '${env.apiBaseUrl}/ppv/iap/intent',
      body: jsonEncode({'titleId': titleId}),
    );
    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw Exception('Failed to start purchase (${response.statusCode})');
    }
    return jsonDecode(response.body) as Map<String, dynamic>;
  }

  /// Verifies a completed Apple purchase against the App Store Server API.
  Future<Map<String, dynamic>> verifyIapPurchase({
    required String intentId,
    required String transactionId,
  }) async {
    final response = await apiClient.post(
      '${env.apiBaseUrl}/ppv/iap/verify',
      body: jsonEncode({'intentId': intentId, 'transactionId': transactionId}),
    );
    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw Exception('Failed to verify purchase (${response.statusCode})');
    }
    return jsonDecode(response.body) as Map<String, dynamic>;
  }

  Future<List<MediaItem>> search(String query) async {
    final q = query.trim();
    if (q.isEmpty) return fetchTitles();

    final response = await apiClient.get(
        '${env.apiBaseUrl}/search/titles?q=${Uri.encodeQueryComponent(q)}');
    if (response.statusCode >= 200 && response.statusCode < 300) {
      final json = jsonDecode(response.body) as Map<String, dynamic>;
      return ((json['titles'] as List?) ?? const [])
          .whereType<Map<String, dynamic>>()
          .map(MediaItem.fromJson)
          .toList();
    }

    // Fallback for environments where search route is not yet deployed.
    final items = await fetchTitles();
    final lq = q.toLowerCase();
    return items
        .where((item) =>
            item.title.toLowerCase().contains(lq) ||
            item.description.toLowerCase().contains(lq))
        .toList();
  }
}
