import '../../../core/env/app_env.dart';

class MediaSource {
  MediaSource({required this.rendition, required this.url});

  final String rendition;
  final String url;

  static int rank(String r) {
    switch (r.toUpperCase()) {
      case 'R4K':
        return 5;
      case 'R2K':
        return 4;
      case 'R1080':
        return 3;
      case 'R720':
        return 2;
      case 'R360':
        return 1;
      default:
        return 0;
    }
  }

  factory MediaSource.fromJson(Map<String, dynamic> json) => MediaSource(
        rendition: (json['rendition'] ?? 'AUTO').toString(),
        url: (json['url'] ?? '').toString(),
      );
}

class MediaItem {
  MediaItem({
    required this.id,
    required this.title,
    required this.description,
    required this.type,
    required this.thumbnailUrl,
    required this.bannerUrl,
    this.genres = const [],
    this.releaseYear,
    this.durationLabel,
    this.rating,
    this.playbackUrl,
    this.sources = const [],
    this.episodes = const [],
    this.isPpv = false,
    this.ppvPriceNaira,
    this.ppvCurrency,
  });

  final String id;
  final String title;
  final String description;
  final String type;
  final String thumbnailUrl;
  final String bannerUrl;
  final List<String> genres;
  final int? releaseYear;
  final String? durationLabel;
  final String? rating;
  final String? playbackUrl;
  final List<MediaSource> sources;
  final List<MediaEpisode> episodes;
  final bool isPpv;
  final double? ppvPriceNaira;
  final String? ppvCurrency;

  bool get isSeries => type.toUpperCase() == 'SERIES';

  List<MediaSource> get orderedSources {
    final list = [...sources]..sort((a, b) =>
        MediaSource.rank(b.rendition) - MediaSource.rank(a.rendition));
    return list.where((s) => s.url.isNotEmpty).toList();
  }

  factory MediaItem.fromJson(Map<String, dynamic> json) {
    final env = AppEnv.fromDefines();

    String pickImage() {
      final raw =
          (json['posterUrl'] ?? json['thumbnailUrl'] ?? json['image'] ?? '')
              .toString();
      return env.resolveImageUrl(raw);
    }

    return MediaItem(
      id: (json['id'] ?? '').toString(),
      title: (json['title'] ?? json['name'] ?? 'Untitled').toString(),
      description: (json['description'] ?? '').toString(),
      type: (json['type'] ?? 'MOVIE').toString(),
      thumbnailUrl: pickImage(),
      bannerUrl: env.resolveImageUrl(
          (json['heroUrl'] ?? json['backdropUrl'] ?? pickImage()).toString()),
      genres: ((json['genres'] as List?) ?? const [])
          .map((e) => e.toString())
          .toList(),
      releaseYear: int.tryParse((json['releaseYear'] ?? '').toString()),
      durationLabel: json['durationLabel']?.toString(),
      rating: (json['rating'] ?? json['maturityRating'])?.toString(),
      playbackUrl: (json['playbackUrl'] ?? json['url'])?.toString(),
      sources: ((json['assetVersions'] as List?) ?? const [])
          .whereType<Map<String, dynamic>>()
          .map(MediaSource.fromJson)
          .where((s) => s.url.isNotEmpty)
          .toList(),
      episodes: ((json['episodes'] as List?) ?? const [])
          .whereType<Map<String, dynamic>>()
          .map(MediaEpisode.fromJson)
          .toList(),
      isPpv: json['isPpv'] == true,
      ppvPriceNaira: double.tryParse((json['ppvPriceNaira'] ?? '').toString()),
      ppvCurrency: json['ppvCurrency']?.toString(),
    );
  }
}

class PpvAccess {
  PpvAccess({
    required this.isPpv,
    required this.hasAccess,
    this.priceNaira,
    this.currency,
    this.accessExpiresAt,
  });

  final bool isPpv;
  final bool hasAccess;
  final double? priceNaira;
  final String? currency;
  final String? accessExpiresAt;

  factory PpvAccess.fromJson(Map<String, dynamic> json) => PpvAccess(
        isPpv: json['isPpv'] == true,
        hasAccess: json['hasAccess'] == true,
        priceNaira: double.tryParse((json['priceNaira'] ?? '').toString()),
        currency: json['currency']?.toString(),
        accessExpiresAt: json['accessExpiresAt']?.toString(),
      );
}

class MediaEpisode {
  MediaEpisode({
    required this.id,
    required this.title,
    required this.seasonNumber,
    required this.episodeNumber,
    this.playbackUrl,
    this.description,
    this.sources = const [],
  });

  final String id;
  final String title;
  final int seasonNumber;
  final int episodeNumber;
  final String? playbackUrl;
  final String? description;
  final List<MediaSource> sources;

  List<MediaSource> get orderedSources {
    final list = [...sources]..sort((a, b) =>
        MediaSource.rank(b.rendition) - MediaSource.rank(a.rendition));
    return list.where((s) => s.url.isNotEmpty).toList();
  }

  factory MediaEpisode.fromJson(Map<String, dynamic> json) => MediaEpisode(
        id: (json['id'] ?? '').toString(),
        title: (json['title'] ?? json['name'] ?? 'Episode').toString(),
        seasonNumber: int.tryParse((json['seasonNumber'] ?? 1).toString()) ?? 1,
        episodeNumber:
            int.tryParse((json['episodeNumber'] ?? 1).toString()) ?? 1,
        playbackUrl: (json['playbackUrl'] ?? json['url'])?.toString(),
        description: (json['description'] ?? json['synopsis'])?.toString(),
        sources: ((json['assetVersions'] as List?) ?? const [])
            .whereType<Map<String, dynamic>>()
            .map(MediaSource.fromJson)
            .where((s) => s.url.isNotEmpty)
            .toList(),
      );
}

class ContinueWatchingItem {
  ContinueWatchingItem({
    required this.item,
    required this.completionPercent,
    this.remainingLabel,
  });

  final MediaItem item;
  final double completionPercent;
  final String? remainingLabel;

  int get watchedPercent => (completionPercent * 100).round().clamp(0, 100);

  String get remainingText =>
      (remainingLabel == null || remainingLabel!.trim().isEmpty)
          ? 'Continue watching'
          : '${remainingLabel!.trim()} remaining';

  factory ContinueWatchingItem.fromJson(Map<String, dynamic> json) {
    String? firstNonEmpty(List<dynamic> values) {
      for (final value in values) {
        final text = value?.toString().trim() ?? '';
        if (text.isNotEmpty) return text;
      }
      return null;
    }

    int? parseInt(dynamic value) {
      if (value is int) return value;
      if (value is num) return value.round();
      return int.tryParse('${value ?? ''}');
    }

    double? parseDouble(dynamic value) {
      if (value is num) return value.toDouble();
      return double.tryParse('${value ?? ''}');
    }

    final contentPayload = (json['title'] is Map<String, dynamic>)
        ? (json['title'] as Map<String, dynamic>)
        : (json['item'] is Map<String, dynamic>)
            ? (json['item'] as Map<String, dynamic>)
            : (json['media'] is Map<String, dynamic>)
                ? (json['media'] as Map<String, dynamic>)
                : (json['content'] is Map<String, dynamic>)
                    ? (json['content'] as Map<String, dynamic>)
                    : json;

    final durationSec = parseInt(json['durationSeconds']) ??
        parseInt(json['durationSec']) ??
        parseInt(json['runtimeSeconds']) ??
        parseInt(json['runtimeSec']) ??
        parseInt(contentPayload['durationSeconds']) ??
        parseInt(contentPayload['runtimeSeconds']);
    final positionSec = parseInt(json['progressSeconds']) ??
        parseInt(json['positionSeconds']) ??
        parseInt(json['positionSec']) ??
        parseInt(json['watchedSeconds']) ??
        parseInt(json['currentTimeSec']) ??
        parseInt(json['watchTimeSeconds']) ??
        parseInt(contentPayload['progressSeconds']);

    final completionRaw = firstNonEmpty([
          json['completionPercent'],
          json['progress'],
          json['watchProgress'],
          json['progressPercent'],
          json['percentComplete'],
          json['completion'],
        ]) ??
        parseDouble(json['progressFraction']);
    final completionNum = parseDouble(completionRaw);
    final completionFromPercent = completionNum == null
        ? null
        : (completionNum > 1 ? completionNum / 100 : completionNum);
    final completionFromDuration =
        (durationSec != null && durationSec > 0 && positionSec != null)
            ? (positionSec / durationSec)
            : null;
    final completion =
        (completionFromPercent ?? completionFromDuration ?? 0).clamp(0, 1);

    final hydratedContent = <String, dynamic>{
      ...contentPayload,
      if ((contentPayload['id']?.toString().trim().isEmpty ?? true) &&
          (json['titleId']?.toString().trim().isNotEmpty ?? false))
        'id': json['titleId'],
      if ((contentPayload['id']?.toString().trim().isEmpty ?? true) &&
          (json['id']?.toString().trim().isNotEmpty ?? false))
        'id': json['id'],
      if ((contentPayload['thumbnailUrl']?.toString().trim().isEmpty ?? true) &&
          (json['thumbnailUrl']?.toString().trim().isNotEmpty ?? false))
        'thumbnailUrl': json['thumbnailUrl'],
      if ((contentPayload['heroUrl']?.toString().trim().isEmpty ?? true) &&
          (json['heroUrl']?.toString().trim().isNotEmpty ?? false))
        'heroUrl': json['heroUrl'],
      if ((contentPayload['posterUrl']?.toString().trim().isEmpty ?? true) &&
          (json['posterUrl']?.toString().trim().isNotEmpty ?? false))
        'posterUrl': json['posterUrl'],
    };

    String? remainingLabel = firstNonEmpty([
      json['remainingLabel'],
      json['durationRemainingLabel'],
      json['timeRemaining'],
      json['remaining'],
      hydratedContent['remainingLabel'],
    ]);

    if (remainingLabel == null && durationSec != null && durationSec > 0) {
      final watchedSec =
          positionSec ?? ((completion.clamp(0, 1).toDouble()) * durationSec).round();
      final remSec = (durationSec - watchedSec).clamp(0, durationSec);
      final remMinutes = (remSec / 60).ceil();
      if (remMinutes > 0) remainingLabel = '${remMinutes}m';
    }

    return ContinueWatchingItem(
      item: MediaItem.fromJson(hydratedContent),
      completionPercent: completion.toDouble(),
      remainingLabel: remainingLabel,
    );
  }
}

class LiveEvent {
  LiveEvent({
    required this.id,
    required this.title,
    required this.status,
    this.playbackUrl,
    this.thumbnailUrl,
    this.viewers,
  });

  final String id;
  final String title;
  final String status;
  final String? playbackUrl;
  final String? thumbnailUrl;
  final int? viewers;

  bool get isLive => status.toUpperCase() == 'LIVE';

  factory LiveEvent.fromJson(Map<String, dynamic> json) {
    final env = AppEnv.fromDefines();
    return LiveEvent(
      id: (json['id'] ?? '').toString(),
      title: (json['title'] ?? json['name'] ?? 'Live Event').toString(),
      status: (json['status'] ?? 'SCHEDULED').toString(),
      playbackUrl: (json['playbackUrl'] ?? json['url'])?.toString(),
      thumbnailUrl: env.resolveImageUrl((json['thumbnailUrl'] ?? json['coverImage'])?.toString()),
      viewers: int.tryParse((json['viewerCount'] ?? '').toString()),
    );
  }
}

class LiveChatMessage {
  LiveChatMessage({
    required this.id,
    required this.userName,
    required this.message,
    this.userRole,
  });

  final String id;
  final String userName;
  final String message;
  final String? userRole;

  factory LiveChatMessage.fromJson(Map<String, dynamic> json) => LiveChatMessage(
        id: (json['id'] ?? '').toString(),
        userName: (json['userName'] ?? json['username'] ?? 'Viewer').toString(),
        message: (json['message'] ?? '').toString(),
        userRole: json['userRole']?.toString(),
      );
}

class LiveReactionTotal {
  LiveReactionTotal({required this.type, required this.count});

  final String type;
  final int count;

  factory LiveReactionTotal.fromJson(Map<String, dynamic> json) => LiveReactionTotal(
        type: (json['type'] ?? '').toString(),
        count: int.tryParse((json['count'] ?? 0).toString()) ?? 0,
      );
}

class LiveEngagementSnapshot {
  LiveEngagementSnapshot({
    required this.serverTime,
    required this.messages,
    required this.reactionTotals,
    required this.recentReactions,
  });

  final String? serverTime;
  final List<LiveChatMessage> messages;
  final List<LiveReactionTotal> reactionTotals;
  final List<String> recentReactions;

  factory LiveEngagementSnapshot.fromJson(Map<String, dynamic> json) =>
      LiveEngagementSnapshot(
        serverTime: json['serverTime']?.toString(),
        messages: ((json['messages'] as List?) ?? const [])
            .whereType<Map<String, dynamic>>()
            .map(LiveChatMessage.fromJson)
            .where((m) => m.id.isNotEmpty)
            .toList(),
        reactionTotals: ((json['reactionTotals'] as List?) ?? const [])
            .whereType<Map<String, dynamic>>()
            .map(LiveReactionTotal.fromJson)
            .where((r) => r.type.isNotEmpty)
            .toList(),
        recentReactions: ((json['recentReactions'] as List?) ?? const [])
            .whereType<Map<String, dynamic>>()
            .map((item) => (item['type'] ?? '').toString())
            .where((type) => type.isNotEmpty)
            .toList(),
      );
}
