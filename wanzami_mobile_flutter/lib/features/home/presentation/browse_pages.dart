import 'dart:async';
import 'dart:developer' as developer;
import 'dart:io' show Platform;

import 'package:audio_session/audio_session.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:screen_brightness/screen_brightness.dart';
import 'package:video_player/video_player.dart';
import 'package:volume_controller/volume_controller.dart';
import 'package:wakelock_plus/wakelock_plus.dart';
import 'package:webview_flutter/webview_flutter.dart';

import '../../../core/theme/app_tokens.dart';
import '../../../core/theme/callsheet_tokens.dart';
import '../../../core/widgets/callsheet_kit.dart';
import '../../../core/theme/network_image_with_skeleton.dart';
import '../../../core/theme/section_image_reveal.dart';
import '../../../core/widgets/wanzami_kit.dart';
import '../../content/data/content_models.dart';
import '../../content/data/content_repository.dart';

class BrowsePage extends StatefulWidget {
  const BrowsePage(
      {super.key,
      required this.title,
      required this.loader,
      required this.onOpen});

  final String title;
  final Future<List<MediaItem>> Function() loader;
  final ValueChanged<MediaItem> onOpen;

  @override
  State<BrowsePage> createState() => _BrowsePageState();
}

class _BrowsePageState extends State<BrowsePage> {
  static const _genres = [
    'All',
    'Action',
    'Comedy',
    'Drama',
    'Horror',
    'Romance',
    'Sci-Fi',
    'Thriller'
  ];
  late Future<List<MediaItem>> _future;
  String _selectedGenre = 'All';

  @override
  void initState() {
    super.initState();
    _future = widget.loader();
  }

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<List<MediaItem>>(
      future: _future,
      builder: (context, snapshot) {
        final items = snapshot.data ?? const <MediaItem>[];
        final filtered = _selectedGenre == 'All'
            ? items
            : items
                .where((e) => e.genres
                    .map((g) => g.trim().toLowerCase())
                    .where((g) => g.isNotEmpty)
                    .any((g) => g == _selectedGenre.trim().toLowerCase()))
                .toList();

        final isLoading =
            snapshot.connectionState == ConnectionState.waiting;

        return CustomScrollView(
          slivers: [
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(24, 64, 24, 6),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.center,
                  children: [
                    Container(
                      width: 5,
                      height: 30,
                      decoration: BoxDecoration(
                        gradient: AppTokens.brandGradient,
                        borderRadius: BorderRadius.circular(3),
                        boxShadow: AppTokens.brandGlow,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        widget.title,
                        style: const TextStyle(
                          fontSize: 32,
                          fontWeight: FontWeight.w800,
                          letterSpacing: -0.5,
                          color: AppTokens.primaryText,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
            if (!isLoading)
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(24, 0, 24, 2),
                  child: Text(
                    '${filtered.length} ${filtered.length == 1 ? 'title' : 'titles'}',
                    style: const TextStyle(
                      fontSize: 13,
                      color: AppTokens.secondaryText,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ),
              ),
            const SliverToBoxAdapter(child: SizedBox(height: 14)),
            SliverToBoxAdapter(
              child: SizedBox(
                height: 40,
                child: ListView.separated(
                  padding: const EdgeInsets.symmetric(horizontal: 24),
                  scrollDirection: Axis.horizontal,
                  itemBuilder: (_, i) {
                    final g = _genres[i];
                    final selected = g == _selectedGenre;
                    return _GenreChip(
                      label: g,
                      selected: selected,
                      onTap: () => setState(() => _selectedGenre = g),
                    );
                  },
                  separatorBuilder: (_, __) => const SizedBox(width: 10),
                  itemCount: _genres.length,
                ),
              ),
            ),
            const SliverToBoxAdapter(child: SizedBox(height: 20)),
            if (isLoading)
              const SliverPadding(
                  padding: EdgeInsets.symmetric(horizontal: 24),
                  sliver: _GridSkeletonSliver())
            else if (filtered.isEmpty)
              SliverFillRemaining(
                hasScrollBody: false,
                child: _BrowseEmptyState(genre: _selectedGenre),
              )
            else
              SliverPadding(
                padding: const EdgeInsets.symmetric(horizontal: 24),
                sliver: SliverToBoxAdapter(
                  child: SectionImageReveal(
                    key: ValueKey('${widget.title}-grid-${filtered.length}'),
                    imageUrls: filtered.map((e) => e.thumbnailUrl).toList(),
                    skeleton: const _GridSkeleton(),
                    child: GridView.builder(
                      itemCount: filtered.length,
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      gridDelegate:
                          const SliverGridDelegateWithFixedCrossAxisCount(
                        crossAxisCount: 2,
                        mainAxisSpacing: 22,
                        crossAxisSpacing: 16,
                        childAspectRatio: 2 / 3.42,
                      ),
                      itemBuilder: (context, index) {
                        final item = filtered[index];
                        return PosterCard(
                          item: item,
                          width: double.infinity,
                          onTap: () => widget.onOpen(item),
                        );
                      },
                    ),
                  ),
                ),
              ),
            const SliverToBoxAdapter(child: SizedBox(height: 108)),
          ],
        );
      },
    );
  }
}

class _GridSkeletonSliver extends StatelessWidget {
  const _GridSkeletonSliver();

  @override
  Widget build(BuildContext context) {
    return SliverToBoxAdapter(child: _GridSkeleton());
  }
}

class _GridSkeleton extends StatelessWidget {
  const _GridSkeleton();

  @override
  Widget build(BuildContext context) {
    return GridView.builder(
      itemCount: 6,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        mainAxisSpacing: 22,
        crossAxisSpacing: 16,
        childAspectRatio: 2 / 3.42,
      ),
      itemBuilder: (_, __) => const Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(
              child: PulseSkeleton(
                  borderRadius: BorderRadius.all(Radius.circular(12)))),
          SizedBox(height: 8),
          SizedBox(
              height: 12,
              child: PulseSkeleton(
                  borderRadius: BorderRadius.all(Radius.circular(6)))),
          SizedBox(height: 4),
          SizedBox(
              height: 10,
              child: PulseSkeleton(
                  borderRadius: BorderRadius.all(Radius.circular(6)))),
        ],
      ),
    );
  }
}

/// Orange brand filter chip: active = orange gradient fill with glow,
/// inactive = surface with a subtle border.
class _GenreChip extends StatelessWidget {
  const _GenreChip({
    required this.label,
    required this.selected,
    required this.onTap,
  });

  final String label;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Pressable(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 180),
        curve: Curves.easeOut,
        padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 9),
        alignment: Alignment.center,
        decoration: BoxDecoration(
          color: selected ? null : AppTokens.surface,
          gradient: selected ? AppTokens.brandGradient : null,
          borderRadius: BorderRadius.circular(AppTokens.radiusPill),
          border: Border.all(
            color: selected ? Colors.transparent : AppTokens.border,
          ),
          boxShadow: selected ? AppTokens.brandGlow : null,
        ),
        child: Text(
          label,
          style: TextStyle(
            color:
                selected ? AppTokens.onBrandOrange : AppTokens.secondaryText,
            fontWeight: FontWeight.w700,
            fontSize: 13,
          ),
        ),
      ),
    );
  }
}

/// Cinematic empty state for a browse grid with no matching titles.
class _BrowseEmptyState extends StatelessWidget {
  const _BrowseEmptyState({required this.genre});

  final String genre;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.fromLTRB(40, 24, 40, 120),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 76,
              height: 76,
              decoration: BoxDecoration(
                color: AppTokens.surface,
                shape: BoxShape.circle,
                border: Border.all(color: AppTokens.border),
              ),
              child: const Icon(Icons.movie_filter_outlined,
                  color: AppTokens.brandOrangeLight, size: 34),
            ),
            const SizedBox(height: 18),
            const Text(
              'Nothing here yet',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w700,
                color: AppTokens.primaryText,
              ),
            ),
            const SizedBox(height: 6),
            Text(
              genre == 'All'
                  ? 'No titles are available right now. Check back soon.'
                  : 'No $genre titles right now. Try another category.',
              textAlign: TextAlign.center,
              style: const TextStyle(
                color: AppTokens.secondaryText,
                fontSize: 13.5,
                height: 1.4,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class SearchPage extends StatefulWidget {
  const SearchPage({super.key, required this.repository, required this.onOpen});

  final ContentRepository repository;
  final ValueChanged<MediaItem> onOpen;

  @override
  State<SearchPage> createState() => _SearchPageState();
}

/// Search — "the index": pull a file from the production archive.
class _SearchPageState extends State<SearchPage> {
  final _controller = TextEditingController();
  final _focusNode = FocusNode();
  List<MediaItem> _items = const [];
  static const _trending = [
    'Lagos Rising',
    'The Kingdom',
    'Empire of Gold',
    'Warrior Queen',
  ];

  @override
  void initState() {
    super.initState();
    _focusNode.addListener(() {
      if (mounted) setState(() {});
    });
  }

  @override
  void dispose() {
    _controller.dispose();
    _focusNode.dispose();
    super.dispose();
  }

  Future<void> _runSearch() async {
    final results = await widget.repository.search(_controller.text);
    if (mounted) setState(() => _items = results);
  }

  @override
  Widget build(BuildContext context) {
    final showTrending = _controller.text.trim().isEmpty && _items.isEmpty;

    return Container(
      color: CsTokens.paper,
      child: SafeArea(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const SizedBox(height: 10),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 14),
              child: Row(
                children: [
                  Semantics(
                    button: true,
                    label: 'Close search',
                    child: GestureDetector(
                      onTap: () => Navigator.pop(context),
                      behavior: HitTestBehavior.opaque,
                      child: Container(
                        width: CsTokens.touchTarget,
                        height: CsTokens.touchTarget,
                        decoration: BoxDecoration(border: CsTokens.border()),
                        child: const Icon(Icons.close,
                            color: CsTokens.ink, size: 20),
                      ),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Container(
                      height: CsTokens.touchTarget,
                      padding: const EdgeInsets.symmetric(horizontal: 10),
                      decoration: BoxDecoration(
                        color: CsTokens.paper,
                        border: CsTokens.border(
                            _focusNode.hasFocus ? 3 : CsTokens.borderWidth),
                      ),
                      child: Row(
                        children: [
                          const Icon(Icons.search,
                              color: CsTokens.ink, size: 20),
                          const SizedBox(width: 8),
                          Expanded(
                            child: TextField(
                              controller: _controller,
                              focusNode: _focusNode,
                              autofocus: true,
                              onChanged: (_) => setState(() {}),
                              onSubmitted: (_) => _runSearch(),
                              style: const TextStyle(
                                  color: CsTokens.ink,
                                  fontSize: 15,
                                  fontWeight: FontWeight.w600),
                              cursorColor: CsTokens.ink,
                              decoration: const InputDecoration(
                                isDense: true,
                                border: InputBorder.none,
                                hintText: 'Search the index\u2026',
                                hintStyle:
                                    TextStyle(color: CsTokens.mutedInk),
                              ),
                            ),
                          ),
                          if (_controller.text.trim().isNotEmpty)
                            GestureDetector(
                              onTap: _runSearch,
                              child: const Padding(
                                padding: EdgeInsets.all(6),
                                child: Icon(Icons.arrow_forward,
                                    color: CsTokens.rust, size: 20),
                              ),
                            ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 18),
            Expanded(
              child: showTrending
                  ? ListView(
                      padding: const EdgeInsets.symmetric(horizontal: 14),
                      children: [
                        const CsSlug('Frequently pulled files'),
                        const SizedBox(height: 10),
                        for (final item in _trending)
                          Padding(
                            padding: const EdgeInsets.only(bottom: 9),
                            child: GestureDetector(
                              onTap: () {
                                _controller.text = item;
                                _runSearch();
                              },
                              child: Container(
                                constraints: const BoxConstraints(
                                    minHeight: CsTokens.touchTarget),
                                padding: const EdgeInsets.symmetric(
                                    horizontal: 12),
                                decoration: BoxDecoration(
                                  color: CsTokens.panel,
                                  border: CsTokens.border(2),
                                ),
                                child: Row(
                                  children: [
                                    const Icon(Icons.trending_up,
                                        color: CsTokens.rust, size: 18),
                                    const SizedBox(width: 12),
                                    Expanded(
                                      child: Text(item.toUpperCase(),
                                          style: CsTokens.mono(
                                              size: 11,
                                              color: CsTokens.ink,
                                              weight: FontWeight.w700)),
                                    ),
                                    const Icon(Icons.north_east,
                                        color: CsTokens.mutedInk, size: 16),
                                  ],
                                ),
                              ),
                            ),
                          ),
                      ],
                    )
                  : _items.isEmpty
                      ? const _SearchEmptyState()
                      : ListView.separated(
                          padding: const EdgeInsets.fromLTRB(14, 0, 14, 24),
                          itemCount: _items.length,
                          separatorBuilder: (_, __) =>
                              const SizedBox(height: 10),
                          itemBuilder: (context, index) {
                            final item = _items[index];
                            return _SearchResultTile(
                              item: item,
                              onTap: () => widget.onOpen(item),
                            );
                          },
                        ),
            ),
          ],
        ),
      ),
    );
  }
}

/// Search result row: bordered file card with thumb, title, and spec meta.
class _SearchResultTile extends StatelessWidget {
  const _SearchResultTile({required this.item, required this.onTap});

  final MediaItem item;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final meta = <String>[
      if (item.isSeries) 'SERIES' else 'FEATURE',
      if (item.releaseYear != null) '${item.releaseYear}',
      if (!item.isSeries && (item.durationLabel ?? '').isNotEmpty)
        item.durationLabel!.toUpperCase(),
    ].join(' \u00b7 ');

    return GestureDetector(
      onTap: onTap,
      child: Container(
        decoration: BoxDecoration(
          color: CsTokens.panel,
          border: CsTokens.border(2),
        ),
        child: Row(
          children: [
            SizedBox(
              width: 64,
              height: 88,
              child: item.thumbnailUrl.isNotEmpty
                  ? NetworkImageWithSkeleton(
                      url: item.thumbnailUrl,
                      fit: BoxFit.cover,
                      decodeWidth: 128)
                  : const ColoredBox(color: CsTokens.cinemaPanel),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    item.title.toUpperCase(),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: CsTokens.display(size: 18),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    meta,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: CsTokens.mono(size: 9),
                  ),
                ],
              ),
            ),
            const Padding(
              padding: EdgeInsets.symmetric(horizontal: 12),
              child: Icon(Icons.play_arrow_rounded,
                  color: CsTokens.ink, size: 24),
            ),
          ],
        ),
      ),
    );
  }
}

/// Empty state shown when a search returns no matches.
class _SearchEmptyState extends StatelessWidget {
  const _SearchEmptyState();

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.fromLTRB(30, 0, 30, 120),
        child: Container(
          padding: const EdgeInsets.all(18),
          decoration: BoxDecoration(
            color: CsTokens.panel,
            border: CsTokens.border(2),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const CsSlug('File not found'),
              const SizedBox(height: 6),
              Text('NOTHING IN THE INDEX', style: CsTokens.display(size: 24)),
              const SizedBox(height: 4),
              const Text('Try a different title or keyword.',
                  style: CsTokens.body),
            ],
          ),
        ),
      ),
    );
  }
}

class DetailPage extends StatefulWidget {
  const DetailPage({
    super.key,
    required this.item,
    required this.onPlay,
    required this.repository,
    required this.profileId,
    this.isGuest = false,
    this.onRequireLogin,
  });

  final MediaItem item;
  final Future<void> Function(MediaItem item, MediaEpisode? episode) onPlay;
  final ContentRepository repository;
  final String profileId;
  final bool isGuest;
  final VoidCallback? onRequireLogin;

  @override
  State<DetailPage> createState() => _DetailPageState();
}

class _DetailPageState extends State<DetailPage> {
  PpvAccess? _ppvAccess;
  bool _paying = false;
  bool _startingPlayback = false;
  String? _paymentStatus;
  String? _pendingFlutterwaveTxRef;
  String? _resumeEpisodeId;

  void _setPaymentStatus(String? status) {
    if (!mounted) return;
    setState(() => _paymentStatus = status);
  }

  void _setPendingFlutterwaveTxRef(String? txRef) {
    final value = txRef?.trim();
    _pendingFlutterwaveTxRef = (value == null || value.isEmpty) ? null : value;
  }

  void _clearPendingFlutterwaveState() {
    _pendingFlutterwaveTxRef = null;
  }

  Future<bool> _pollForAccessUnlock() async {
    const maxAttempts = 10;
    for (var i = 0; i < maxAttempts; i++) {
      _setPaymentStatus('Finalizing payment… (${i + 1}/$maxAttempts)');
      await _loadAccess();
      if (_ppvAccess?.hasAccess == true) return true;
      await Future.delayed(const Duration(seconds: 2));
    }
    return false;
  }

  bool _hasPlayableAsset(MediaItem item, {MediaEpisode? episode}) {
    if (episode != null) {
      return episode.orderedSources.isNotEmpty ||
          ((episode.playbackUrl ?? '').isNotEmpty);
    }
    return item.orderedSources.isNotEmpty ||
        ((item.playbackUrl ?? '').isNotEmpty);
  }

  List<MediaEpisode> _sortedEpisodes(MediaItem item) {
    final episodes = [...item.episodes];
    episodes.sort((a, b) {
      final bySeason = a.seasonNumber.compareTo(b.seasonNumber);
      if (bySeason != 0) return bySeason;
      final byEpisode = a.episodeNumber.compareTo(b.episodeNumber);
      if (byEpisode != 0) return byEpisode;
      return a.title.compareTo(b.title);
    });
    return episodes;
  }

  MediaEpisode? _resolveSeriesEpisode(
    MediaItem item, {
    String? preferredEpisodeId,
  }) {
    final episodes = _sortedEpisodes(item);
    if (episodes.isEmpty) return null;
    final wantedId = preferredEpisodeId?.trim();
    if (wantedId != null && wantedId.isNotEmpty) {
      for (final episode in episodes) {
        if (episode.id == wantedId) return episode;
      }
    }
    return episodes.first;
  }

  Future<void> _loadSeriesResumeEpisode() async {
    if (!widget.item.isSeries || widget.profileId.isEmpty) return;
    try {
      final items = await widget.repository
          .fetchContinueWatching(profileId: widget.profileId);
      if (!mounted) return;
      final match = items.cast<ContinueWatchingItem?>().firstWhere(
            (entry) => entry?.item.id == widget.item.id,
            orElse: () => null,
          );
      final nextEpisodeId = match?.episodeId?.trim();
      if (nextEpisodeId == null || nextEpisodeId.isEmpty) return;
      setState(() => _resumeEpisodeId = nextEpisodeId);
    } catch (_) {}
  }

  Future<MediaItem> _fetchFreshDetail() {
    return widget.repository.fetchTitleDetail(
      widget.item.id,
      profileId: widget.profileId,
    );
  }

  Future<MediaItem?> _refreshDetailUntilPlayable({
    String? targetEpisodeId,
    bool poll = false,
  }) async {
    const maxAttempts = 4;
    for (var i = 0; i < maxAttempts; i++) {
      final detail = await _fetchFreshDetail();
      final episode = detail.isSeries
          ? _resolveSeriesEpisode(
              detail,
              preferredEpisodeId: targetEpisodeId,
            )
          : (targetEpisodeId == null
              ? null
              : detail.episodes
                  .where((e) => e.id == targetEpisodeId)
                  .cast<MediaEpisode?>()
                  .firstWhere((e) => e != null, orElse: () => null));
      if (_hasPlayableAsset(detail, episode: episode) ||
          (episode == null && _hasPlayableAsset(detail))) {
        return detail;
      }
      if (!poll) break;
      await Future.delayed(const Duration(milliseconds: 900));
    }
    return null;
  }

  void _promptLogin(String message) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(message)));
    widget.onRequireLogin?.call();
  }

  Future<void> _startPlayback(
      {MediaEpisode? episode, bool pollForEntitlement = false}) async {
    if (widget.isGuest) {
      _promptLogin('Sign in to watch this title.');
      return;
    }
    if (_startingPlayback) return;
    setState(() => _startingPlayback = true);
    try {
      final preferredEpisodeId = episode?.id ??
          (widget.item.isSeries ? _resumeEpisodeId : null) ??
          (widget.item.episodes.isNotEmpty
              ? widget.item.episodes.first.id
              : null);
      final refreshed = await _refreshDetailUntilPlayable(
        targetEpisodeId: preferredEpisodeId,
        poll: pollForEntitlement,
      );
      if (!mounted) return;
      if (refreshed == null) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
              content: Text(
                  'Playback is not ready yet. Please try again in a moment.')),
        );
        return;
      }
      final selectedEpisode = refreshed.isSeries
          ? _resolveSeriesEpisode(
              refreshed,
              preferredEpisodeId: preferredEpisodeId,
            )
          : (preferredEpisodeId == null
              ? null
              : (refreshed.episodes
                      .cast<MediaEpisode?>()
                      .firstWhere((e) => e?.id == preferredEpisodeId,
                          orElse: () => null) ??
                  episode));
      await widget.onPlay(refreshed, selectedEpisode);
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Unable to start playback: $e')),
      );
    } finally {
      if (mounted) setState(() => _startingPlayback = false);
    }
  }

  @override
  void initState() {
    super.initState();
    _loadAccess();
    _loadSeriesResumeEpisode();
  }

  Future<void> _loadAccess() async {
    try {
      final access = await widget.repository.fetchPpvAccess(widget.item.id);
      if (mounted) setState(() => _ppvAccess = access);
    } catch (_) {}
  }

  Future<void> _finalizeFlutterwavePayment(
      Map<String, String>? callback) async {
    final callbackMap = callback ?? const <String, String>{};
    final txRef = (callbackMap['tx_ref'] ??
            callbackMap['txRef'] ??
            _pendingFlutterwaveTxRef)
        ?.trim();
    final transactionId =
        (callbackMap['transaction_id'] ?? callbackMap['transactionId'])?.trim();

    if ((txRef ?? '').isEmpty && (transactionId ?? '').isEmpty) {
      throw Exception(
          'Unable to finalize payment. Missing transaction reference.');
    }

    const verifyAttempts = 4;
    Object? lastVerifyError;

    for (var i = 0; i < verifyAttempts; i++) {
      _setPaymentStatus(
          'Verifying Flutterwave payment… (${i + 1}/$verifyAttempts)');
      try {
        await widget.repository.verifyFlutterwavePurchase(
          txRef: (txRef ?? '').isEmpty ? null : txRef,
          transactionId: (transactionId ?? '').isEmpty ? null : transactionId,
        );
        lastVerifyError = null;
        break;
      } catch (e) {
        lastVerifyError = e;
        if (i < verifyAttempts - 1) {
          await Future.delayed(const Duration(seconds: 2));
        }
      }
    }

    _setPaymentStatus(
        'Waiting for payment confirmation from server. This may take a few seconds…');
    final unlocked = await _pollForAccessUnlock();
    if (!unlocked) {
      if (lastVerifyError != null) {
        throw Exception(
            'Payment not confirmed yet. Verification is still processing: $lastVerifyError');
      }
      throw Exception(
          'Payment not confirmed yet. Please tap Rent again in a few seconds.');
    }
  }

  Future<void> _startPayment() async {
    if (widget.isGuest) {
      _promptLogin('Sign in to buy this title.');
      return;
    }
    setState(() {
      _paying = true;
      _paymentStatus = 'Opening Paystack checkout…';
    });
    try {
      final payload =
          await widget.repository.initiatePaystackPurchase(widget.item.id);
      final authUrl = (payload['authorization_url'] ??
              payload['authorizationUrl'] ??
              payload['url'] ??
              payload['link'])
          ?.toString();
      final reference =
          (payload['reference'] ?? payload['txRef'] ?? payload['tx_ref'])
              ?.toString();

      if (authUrl == null || authUrl.isEmpty) {
        throw Exception('Payment URL missing from backend response');
      }

      _setPaymentStatus('Complete your payment in the Paystack checkout window.');
      if (!mounted) return;
      final callback = await Navigator.of(context).push<Map<String, String>?>(
        MaterialPageRoute(
          builder: (_) => InAppCheckoutPage(
            url: authUrl,
            providerName: 'Paystack',
            providerKey: 'paystack',
          ),
        ),
      );
      if (callback == null) return;

      _setPaymentStatus('Verifying Paystack payment…');
      final finalRef = callback['reference'] ??
          callback['trxref'] ??
          callback['trxRef'] ??
          reference;
      if (finalRef != null && finalRef.isNotEmpty) {
        await widget.repository.verifyPaystackPurchase(finalRef);
      }
      await _loadAccess();

      if (mounted && (_ppvAccess?.hasAccess == true)) {
        _setPaymentStatus('Access granted. Starting playback…');
        await _startPlayback(pollForEntitlement: true);
      }
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context)
          .showSnackBar(SnackBar(content: Text('Payment failed: $e')));
    } finally {
      _clearPendingFlutterwaveState();
      if (mounted) {
        setState(() {
          _paying = false;
          _paymentStatus = null;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final requiresPayment = widget.item.type.toUpperCase() == 'MOVIE' &&
        (widget.item.isPpv || _ppvAccess?.isPpv == true);
    final hasAccess = !requiresPayment || (_ppvAccess?.hasAccess == true);
    final price = _ppvAccess?.priceNaira ?? widget.item.ppvPriceNaira;
    final currency = _ppvAccess?.currency ?? widget.item.ppvCurrency ?? 'NGN';
    final priceLabel = price == null
        ? 'Buy ticket'
        : "Buy ticket \u00b7 ${currency == 'NGN' ? '\u20a6' : '$currency '}${price.toStringAsFixed(0)}";

    return Scaffold(
      backgroundColor: CsTokens.paper,
      body: SafeArea(
        bottom: false,
        child: ListView(
          padding: const EdgeInsets.only(bottom: 48),
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(6, 4, 14, 6),
              child: Row(
                children: [
                  Semantics(
                    button: true,
                    label: 'Back',
                    child: GestureDetector(
                      onTap: () => Navigator.pop(context),
                      behavior: HitTestBehavior.opaque,
                      child: SizedBox(
                        width: CsTokens.touchTarget,
                        height: CsTokens.touchTarget,
                        child: Center(
                          child: Text(
                            '\u2190 BACK',
                            style: CsTokens.mono(
                              size: 12,
                              color: CsTokens.ink,
                              weight: FontWeight.w700,
                            ),
                          ),
                        ),
                      ),
                    ),
                  ),
                  const Spacer(),
                  CsSlug('Scene 1, Act 1 \u00b7 Title ${widget.item.id}', size: 10),
                ],
              ),
            ),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 14),
              child: CsBox(
                shadow: 5,
                borderWidth: CsTokens.borderWidthHeavy,
                child: AspectRatio(
                  aspectRatio: 16 / 9,
                  child: Stack(
                    fit: StackFit.expand,
                    children: [
                      widget.item.bannerUrl.isNotEmpty
                          ? NetworkImageWithSkeleton(
                              url: widget.item.bannerUrl,
                              fit: BoxFit.cover,
                              variant: CsSkeletonVariant.countdown)
                          : Container(color: CsTokens.cinemaPanel),
                      Positioned(
                        top: 8,
                        left: 8,
                        child: CsSticker(
                          hasAccess
                              ? 'In your library'
                              : (requiresPayment ? 'Now selling' : 'Now showing'),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(14, 18, 14, 0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  CsSlug(
                    'Scene 01 \u00b7 ${widget.item.genres.isNotEmpty ? widget.item.genres.first : widget.item.type}',
                  ),
                  const SizedBox(height: 4),
                  Text(
                    widget.item.title.toUpperCase(),
                    style: CsTokens.display(size: 40),
                  ),
                  const SizedBox(height: 10),
                  if (widget.item.durationLabel != null)
                    CsSpecRow('Runtime', widget.item.durationLabel!),
                  if (widget.item.rating != null)
                    CsSpecRow('Rating', widget.item.rating!),
                  if (widget.item.releaseYear != null)
                    CsSpecRow('Year', '${widget.item.releaseYear}'),
                  CsSpecRow('Format', widget.item.isSeries ? 'Series' : 'Feature'),
                  const SizedBox(height: 18),
                  if (hasAccess)
                    CsTicketButton(
                      slug: 'Admitted \u00b7 your ticket',
                      title: _startingPlayback ? 'Preparing\u2026' : 'Play now',
                      icon: Icons.play_arrow_rounded,
                      enabled: !_startingPlayback,
                      onTap: () => _startPlayback(),
                    )
                  else
                    CsTicketButton(
                      slug: 'Admit one \u00b7 30 days',
                      title: _paying ? 'Processing\u2026' : priceLabel,
                      enabled: !_paying,
                      onTap: _startPayment,
                    ),
                  if (_paymentStatus != null) ...[
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        if (_paying)
                          const SizedBox(
                            width: 14,
                            height: 14,
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                              color: CsTokens.rust,
                            ),
                          ),
                        if (_paying) const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            _paymentStatus!,
                            style: CsTokens.mono(size: 10, color: CsTokens.rust),
                          ),
                        ),
                      ],
                    ),
                  ],
                  if (widget.item.trailerUrl != null &&
                      widget.item.trailerUrl!.isNotEmpty) ...[
                    const SizedBox(height: 12),
                    CsButton(
                      'Watch trailer',
                      primary: false,
                      expand: true,
                      onTap: () => Navigator.of(context).push(
                        MaterialPageRoute(
                          builder: (_) => PlayerPage(
                            item: MediaItem(
                              id: widget.item.id,
                              title: '${widget.item.title} \u2014 Trailer',
                              description: '',
                              type: widget.item.type,
                              thumbnailUrl: widget.item.thumbnailUrl,
                              bannerUrl: widget.item.bannerUrl,
                              playbackUrl: widget.item.trailerUrl,
                            ),
                          ),
                        ),
                      ),
                    ),
                  ],
                  const SizedBox(height: 22),
                  const CsSlug('The pitch'),
                  const SizedBox(height: 6),
                  Text(widget.item.description, style: CsTokens.body),
                  if (widget.item.episodes.isNotEmpty && hasAccess) ...[
                    const SizedBox(height: 22),
                    const CsSlug('Shot list \u00b7 Episodes'),
                    const SizedBox(height: 8),
                    for (final ep in widget.item.episodes)
                      Padding(
                        padding: const EdgeInsets.only(bottom: 8),
                        child: GestureDetector(
                          onTap: _startingPlayback
                              ? null
                              : () => _startPlayback(episode: ep),
                          child: Container(
                            constraints: const BoxConstraints(
                                minHeight: CsTokens.touchTarget),
                            padding: const EdgeInsets.symmetric(
                                horizontal: 12, vertical: 10),
                            decoration: BoxDecoration(
                              color: CsTokens.panel,
                              border: CsTokens.border(2),
                            ),
                            child: Row(
                              children: [
                                Text(
                                  'S${ep.seasonNumber} E${ep.episodeNumber}',
                                  style: CsTokens.mono(
                                    size: 11,
                                    color: CsTokens.rust,
                                    weight: FontWeight.w700,
                                  ),
                                ),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: Text(
                                    ep.title,
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                    style: CsTokens.bodyBold,
                                  ),
                                ),
                                const Icon(Icons.play_arrow_rounded,
                                    size: 20, color: CsTokens.ink),
                              ],
                            ),
                          ),
                        ),
                      ),
                  ],
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class InAppCheckoutPage extends StatefulWidget {
  const InAppCheckoutPage(
      {super.key,
      required this.url,
      required this.providerName,
      this.providerKey,
      this.initialTxRef});

  final String url;
  final String providerName;
  final String? providerKey;
  final String? initialTxRef;

  @override
  State<InAppCheckoutPage> createState() => _InAppCheckoutPageState();
}

class _InAppCheckoutPageState extends State<InAppCheckoutPage> {
  late final WebViewController _controller;
  bool _loading = true;
  bool _callbackCaptured = false;
  late final Set<String> _expectedReturnHosts;

  bool get _isFlutterwaveCheckout {
    final key = widget.providerKey?.trim().toLowerCase();
    if (key != null && key.isNotEmpty) return key == 'flutterwave';
    return widget.providerName.toLowerCase().contains('flutterwave');
  }

  Map<String, String> _extractCallbackParams(Uri uri) {
    final params = <String, String>{};

    Map<String, String> safeSplitQueryString(String value) {
      if (value.isEmpty || !value.contains('=')) return const {};
      try {
        return Uri.splitQueryString(value);
      } catch (_) {
        return const {};
      }
    }

    void pickFrom(Map<String, String> source) {
      final txRef = source['tx_ref'] ?? source['txRef'];
      final transactionId =
          source['transaction_id'] ?? source['transactionId'] ?? source['id'];
      final reference = source['reference'];
      final trxRef = source['trxref'] ?? source['trxRef'];

      if (txRef != null && txRef.isNotEmpty) params['tx_ref'] = txRef;
      if (transactionId != null && transactionId.isNotEmpty) {
        params['transaction_id'] = transactionId;
      }
      if (reference != null && reference.isNotEmpty) {
        params['reference'] = reference;
      }
      if (trxRef != null && trxRef.isNotEmpty) params['trxref'] = trxRef;
    }

    pickFrom(uri.queryParameters);

    final fragment = uri.fragment;
    if (fragment.isNotEmpty) {
      final fragmentParams = safeSplitQueryString(fragment);
      pickFrom(fragmentParams);

      final nestedUri = Uri.tryParse(fragment);
      if (nestedUri != null) {
        pickFrom(nestedUri.queryParameters);
        if (nestedUri.fragment.isNotEmpty) {
          pickFrom(safeSplitQueryString(nestedUri.fragment));
        }
      }

      final response = fragmentParams['response'] ?? fragmentParams['resp'];
      if (response != null && response.isNotEmpty) {
        final decodedResponse = Uri.decodeComponent(response);
        pickFrom(safeSplitQueryString(decodedResponse));
        final nestedResponseUri = Uri.tryParse(decodedResponse);
        if (nestedResponseUri != null) {
          pickFrom(nestedResponseUri.queryParameters);
        }
      }
    }

    return params;
  }

  Set<String> _extractExpectedReturnHosts(String checkoutUrl) {
    final hosts = <String>{};
    final checkoutUri = Uri.tryParse(checkoutUrl);
    if (checkoutUri == null) return hosts;

    void pickHostFromRaw(String? rawValue) {
      if (rawValue == null || rawValue.isEmpty) return;
      final decoded = Uri.decodeComponent(rawValue);
      final nested = Uri.tryParse(decoded);
      final host = nested?.host.toLowerCase();
      if (host != null && host.isNotEmpty) hosts.add(host);
    }

    for (final entry in checkoutUri.queryParameters.entries) {
      final key = entry.key.toLowerCase();
      if (key.contains('redirect') || key.contains('callback')) {
        pickHostFromRaw(entry.value);
      }
    }

    final fragment = checkoutUri.fragment;
    if (fragment.isNotEmpty) {
      final nestedFragment = Uri.tryParse(Uri.decodeComponent(fragment));
      if (nestedFragment != null) {
        for (final entry in nestedFragment.queryParameters.entries) {
          final key = entry.key.toLowerCase();
          if (key.contains('redirect') || key.contains('callback')) {
            pickHostFromRaw(entry.value);
          }
        }
      }
    }

    return hosts;
  }

  bool _isLikelyFlutterwaveReturn(Uri uri) {
    final host = uri.host.toLowerCase();
    if (host.isEmpty) return false;

    final looksLikeWanzamiHost =
        host == 'wanzami.com' || host.endsWith('.wanzami.com');
    final hostAllowed =
        _expectedReturnHosts.contains(host) || looksLikeWanzamiHost;
    if (!hostAllowed) return false;

    final path = uri.path.toLowerCase();
    final normalizedPath = path.endsWith('/') && path.length > 1
        ? path.substring(0, path.length - 1)
        : path;

    const returnPaths = {
      '',
      '/',
      '/app',
      '/app/ppv',
      '/ppv',
      '/home',
      '/login',
    };

    if (returnPaths.contains(normalizedPath)) return true;
    if (normalizedPath.startsWith('/app/ppv/')) return true;

    final qp = uri.queryParameters.map((k, v) => MapEntry(k.toLowerCase(), v));
    final status = qp['status']?.toLowerCase();
    if (status == 'successful' ||
        status == 'completed' ||
        status == 'success') {
      return true;
    }

    return false;
  }

  NavigationDecision _handlePotentialCallback(String url) {
    if (_callbackCaptured || !mounted) return NavigationDecision.navigate;

    final uri = Uri.tryParse(url);
    if (uri == null) return NavigationDecision.navigate;

    final params = _extractCallbackParams(uri);
    final hasCallbackParam = params['tx_ref'] != null ||
        params['transaction_id'] != null ||
        params['reference'] != null ||
        params['trxref'] != null;

    if (!hasCallbackParam) {
      if (_isFlutterwaveCheckout && _isLikelyFlutterwaveReturn(uri)) {
        _callbackCaptured = true;
        Navigator.pop(context, <String, String>{
          ...params,
          if ((widget.initialTxRef ?? '').isNotEmpty)
            'tx_ref': widget.initialTxRef!,
          'flutterwave_return': '1',
          'returned_url': url,
        });
        return NavigationDecision.prevent;
      }
      return NavigationDecision.navigate;
    }

    _callbackCaptured = true;
    Navigator.pop(context, params);
    return NavigationDecision.prevent;
  }

  @override
  void initState() {
    super.initState();
    _expectedReturnHosts = _extractExpectedReturnHosts(widget.url);
    _controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setNavigationDelegate(
        NavigationDelegate(
          onNavigationRequest: (request) =>
              _handlePotentialCallback(request.url),
          onUrlChange: (change) {
            final url = change.url;
            if (url == null) return;
            _handlePotentialCallback(url);
          },
          onPageFinished: (_) {
            if (mounted) setState(() => _loading = false);
          },
        ),
      )
      ..loadRequest(Uri.parse(widget.url));
  }

  void _finishWithManualTrigger() {
    if (_callbackCaptured || !mounted) return;
    _callbackCaptured = true;
    Navigator.pop(context, <String, String>{
      'manual': '1',
      if ((widget.initialTxRef ?? '').isNotEmpty)
        'tx_ref': widget.initialTxRef!,
    });
  }

  @override
  Widget build(BuildContext context) {
    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, result) {
        if (didPop) return;
        _finishWithManualTrigger();
      },
      child: Scaffold(
        appBar: AppBar(
          title: Text('${widget.providerName} Checkout'),
          leading: IconButton(
            icon: const Icon(Icons.arrow_back),
            onPressed: _finishWithManualTrigger,
          ),
          actions: [
            TextButton(
              onPressed: _finishWithManualTrigger,
              child: const Text('I HAVE PAID'),
            ),
          ],
        ),
        body: Stack(
          children: [
            WebViewWidget(controller: _controller),
            if (_loading) const Center(child: CircularProgressIndicator()),
          ],
        ),
      ),
    );
  }
}

class PlayerPage extends StatefulWidget {
  const PlayerPage({
    super.key,
    required this.item,
    this.episode,
    this.contentRepository,
    this.liveEventId,
    this.profileId,
  });

  final MediaItem item;
  final MediaEpisode? episode;
  final ContentRepository? contentRepository;
  final String? liveEventId;
  final String? profileId;

  @override
  State<PlayerPage> createState() => _PlayerPageState();
}

enum _PlayerGestureSide { left, right }

class _PlayerPageState extends State<PlayerPage> with WidgetsBindingObserver {
  static const _controlsAutoHideDelay = Duration(seconds: 4);
  static const _seekStep = Duration(seconds: 10);

  VideoPlayerController? _controller;
  List<MediaSource> _sources = const [];
  int _sourceIndex = 0;
  bool _loading = true;
  String? _error;
  bool _restoredSystemUi = false;
  bool _isDisposed = false;
  int _openRequestId = 0;
  bool _showControls = true;
  Timer? _hideControlsTimer;
  Timer? _progressTimer;
  bool _didReportPlayStart = false;
  double _volumeLevel = 1;
  bool _muted = false;
  double _volumeBeforeMute = 1;
  double _brightnessLevel = 0.5;
  _PlayerGestureSide? _gestureSide;
  double? _lastGestureGlobalY;

  final List<String> _reactionPresets = const ['❤️', '🔥', '👏', '😂', '🎉'];
  final TextEditingController _chatController = TextEditingController();
  List<LiveChatMessage> _messages = const [];
  List<LiveReactionTotal> _reactionTotals = const [];
  List<String> _burstReactions = const [];
  bool _chatSending = false;
  bool _chatPanelOpen = true;
  bool _chatInputExpanded = false;
  String? _lastEngagementSync;
  Timer? _engagementTimer;

  StreamSubscription<AudioInterruptionEvent>? _audioInterruptionSub;
  StreamSubscription<void>? _becomingNoisySub;
  bool _resumeAfterInterruption = false;
  bool _inForeground = true;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _enterLandscapePlaybackMode();
    WidgetsBinding.instance
        .addPostFrameCallback((_) => _enterLandscapePlaybackMode());
    _prepare();
    unawaited(_configureAudioInterruptionHandling());
    unawaited(_initPlayerFeedbackControls());
    unawaited(_updateWakeLock());
    if (_isLiveMode) {
      unawaited(_syncEngagement());
      _engagementTimer = Timer.periodic(
        const Duration(milliseconds: 2500),
        (_) => unawaited(_syncEngagement()),
      );
    }
  }

  bool get _isLiveMode =>
      widget.item.type.toUpperCase() == 'LIVE' &&
      widget.contentRepository != null &&
      (widget.liveEventId ?? widget.item.id).isNotEmpty;

  String get _liveEventId => widget.liveEventId ?? widget.item.id;

  @override
  void dispose() {
    _isDisposed = true;
    _openRequestId++;
    _hideControlsTimer?.cancel();
    _engagementTimer?.cancel();
    _audioInterruptionSub?.cancel();
    _becomingNoisySub?.cancel();
    _chatController.dispose();
    WidgetsBinding.instance.removeObserver(this);
    _progressTimer?.cancel();
    _controller?.removeListener(_onVideoTick);
    if (_didReportPlayStart) _reportWatchProgress('PLAY_END');
    unawaited(_stopPlayback(disposeController: true));
    unawaited(ScreenBrightness.instance.resetScreenBrightness());
    unawaited(WakelockPlus.disable());
    unawaited(_restoreSystemUi());
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) {
      _inForeground = true;
      unawaited(_enterLandscapePlaybackMode());
      unawaited(_resumeAfterInterruptionIfNeeded());
      unawaited(_updateWakeLock());
      return;
    }

    if (state == AppLifecycleState.inactive ||
        state == AppLifecycleState.hidden ||
        state == AppLifecycleState.paused) {
      _inForeground = false;
      unawaited(_pauseForInterruption());
      unawaited(WakelockPlus.disable());
      return;
    }

    if (state == AppLifecycleState.detached) {
      _inForeground = false;
      unawaited(_stopPlayback(disposeController: false));
      unawaited(WakelockPlus.disable());
    }
  }

  Future<void> _enterLandscapePlaybackMode() async {
    await SystemChrome.setEnabledSystemUIMode(SystemUiMode.immersiveSticky);
    await SystemChrome.setPreferredOrientations([
      DeviceOrientation.landscapeLeft,
      DeviceOrientation.landscapeRight,
    ]);
  }

  Future<void> _restoreSystemUi() async {
    if (_restoredSystemUi) return;
    _restoredSystemUi = true;
    await SystemChrome.setEnabledSystemUIMode(SystemUiMode.edgeToEdge);
    await SystemChrome.setPreferredOrientations([
      DeviceOrientation.portraitUp,
    ]);
  }

  Future<void> _configureAudioInterruptionHandling() async {
    try {
      final session = await AudioSession.instance;

      _audioInterruptionSub = session.interruptionEventStream.listen((event) {
        if (event.begin) {
          unawaited(_pauseForInterruption());
          return;
        }

        if (_inForeground) {
          unawaited(_resumeAfterInterruptionIfNeeded());
        }
      });

      _becomingNoisySub = session.becomingNoisyEventStream.listen((_) {
        unawaited(_pauseForInterruption());
      });
    } catch (_) {
      // Best-effort interruption handling.
    }
  }

  Future<void> _pauseForInterruption() async {
    final controller = _controller;
    if (controller == null || !controller.value.isInitialized) return;

    _resumeAfterInterruption = controller.value.isPlaying;
    if (!_resumeAfterInterruption) return;

    try {
      await controller.pause();
    } catch (_) {}

    await _updateWakeLock();
  }

  Future<void> _resumeAfterInterruptionIfNeeded() async {
    if (!_resumeAfterInterruption || _isDisposed) return;

    final controller = _controller;
    if (controller == null || !controller.value.isInitialized) {
      if (_isLiveMode && _sources.isNotEmpty) {
        await _openSource(_sourceIndex.clamp(0, _sources.length - 1).toInt());
      }
      _resumeAfterInterruption = false;
      return;
    }

    try {
      await controller.play();
      _showControlsTemporarily();
    } catch (_) {
      if (_isLiveMode && _sources.isNotEmpty) {
        await _openSource(_sourceIndex.clamp(0, _sources.length - 1).toInt());
      }
    } finally {
      _resumeAfterInterruption = false;
      await _updateWakeLock();
    }
  }

  Future<void> _stopPlayback({required bool disposeController}) async {
    final controller = _controller;
    if (controller == null) return;

    try {
      await controller.pause();
    } catch (_) {}

    try {
      await controller.seekTo(Duration.zero);
    } catch (_) {}

    _resumeAfterInterruption = false;

    if (disposeController) {
      _controller = null;
      try {
        await controller.dispose();
      } catch (_) {}
    }

    await _updateWakeLock();
  }

  Future<bool> _onWillPop() async {
    await _stopPlayback(disposeController: true);
    await _restoreSystemUi();
    return true;
  }

  void _onVideoTick() {
    if (mounted) setState(() {});
    unawaited(_updateWakeLock());
  }

  Future<void> _initPlayerFeedbackControls() async {
    try {
      final volume = await VolumeController.instance.getVolume();
      if (mounted) {
        setState(() => _volumeLevel = volume.clamp(0.0, 1.0).toDouble());
      }
    } catch (_) {}

    try {
      final brightness = await ScreenBrightness.instance.current;
      if (mounted) {
        setState(
            () => _brightnessLevel = brightness.clamp(0.0, 1.0).toDouble());
      }
    } catch (_) {}
  }

  Future<void> _updateWakeLock() async {
    final controller = _controller;
    final shouldKeepAwake = _showControls ||
        (controller?.value.isInitialized == true &&
            controller!.value.isPlaying);
    try {
      await WakelockPlus.toggle(enable: shouldKeepAwake);
    } catch (_) {}
  }

  Future<void> _setVolume(double value) async {
    final clamped = value.clamp(0.0, 1.0).toDouble();
    setState(() => _volumeLevel = clamped);
    try {
      VolumeController.instance.showSystemUI = false;
      await VolumeController.instance.setVolume(clamped);
    } catch (_) {}
    _showControlsTemporarily();
  }

  Future<void> _toggleMute() async {
    if (_muted) {
      setState(() => _muted = false);
      await _setVolume(_volumeBeforeMute > 0 ? _volumeBeforeMute : 0.7);
    } else {
      setState(() {
        _volumeBeforeMute = _volumeLevel;
        _muted = true;
      });
      await _setVolume(0);
    }
  }

  Future<void> _setBrightness(double value) async {
    final clamped = value.clamp(0.0, 1.0).toDouble();
    setState(() => _brightnessLevel = clamped);
    try {
      await ScreenBrightness.instance.setScreenBrightness(clamped);
    } catch (_) {}
    _showControlsTemporarily();
  }

  void _handleVerticalDragStart(DragStartDetails details, double width) {
    _gestureSide = details.localPosition.dx < (width / 2)
        ? _PlayerGestureSide.left
        : _PlayerGestureSide.right;
    _lastGestureGlobalY = details.globalPosition.dy;
  }

  void _handleVerticalDragUpdate(DragUpdateDetails details) {
    if (_gestureSide == null || _lastGestureGlobalY == null) return;

    final deltaY = _lastGestureGlobalY! - details.globalPosition.dy;
    _lastGestureGlobalY = details.globalPosition.dy;

    if (deltaY.abs() < 1) return;

    final nextDelta = deltaY / 280;
    if (_gestureSide == _PlayerGestureSide.left) {
      unawaited(_setBrightness(_brightnessLevel + nextDelta));
    } else {
      unawaited(_setVolume(_volumeLevel + nextDelta));
    }
  }

  void _handleVerticalDragEnd([DragEndDetails? _]) {
    _gestureSide = null;
    _lastGestureGlobalY = null;
  }

  void _restartAutoHideTimer() {
    _hideControlsTimer?.cancel();
    final c = _controller;
    if (c == null || !c.value.isInitialized || !c.value.isPlaying) {
      unawaited(_updateWakeLock());
      return;
    }
    _hideControlsTimer = Timer(_controlsAutoHideDelay, () {
      if (!mounted) return;
      setState(() => _showControls = false);
      unawaited(_updateWakeLock());
    });
    unawaited(_updateWakeLock());
  }

  void _showControlsTemporarily() {
    if (!_showControls) {
      setState(() => _showControls = true);
    }
    _restartAutoHideTimer();
  }

  void _toggleControls() {
    setState(() => _showControls = !_showControls);
    if (_showControls) {
      _restartAutoHideTimer();
    } else {
      _hideControlsTimer?.cancel();
      unawaited(_updateWakeLock());
    }
  }

  Future<void> _syncEngagement() async {
    if (!_isLiveMode || _isDisposed) return;
    try {
      final snapshot =
          await widget.contentRepository!.fetchLiveEngagementSnapshot(
        _liveEventId,
        since: _lastEngagementSync,
      );
      if (!mounted || _isDisposed) return;
      final next = [..._messages, ...snapshot.messages];
      final seen = <String>{};
      final deduped = <LiveChatMessage>[];
      for (final item in next.reversed) {
        if (seen.add(item.id)) deduped.add(item);
      }
      setState(() {
        _messages = deduped.reversed.take(200).toList();
        _reactionTotals = snapshot.reactionTotals;
        _burstReactions = snapshot.recentReactions.take(12).toList();
        _lastEngagementSync = snapshot.serverTime ?? _lastEngagementSync;
      });
    } catch (_) {}
  }

  bool _isHlsLikeUrl(String url) {
    final uri = Uri.tryParse(url);
    final key = (uri?.queryParameters['key'] ?? '').toLowerCase();
    final source = url.toLowerCase();
    return source.contains('.m3u8') || key.contains('.m3u8');
  }

  VideoFormat? _inferVideoFormat(String url) {
    final uri = Uri.tryParse(url);
    final key = (uri?.queryParameters['key'] ?? '').toLowerCase();
    final source = url.toLowerCase();
    final combined = '$source $key';

    if (combined.contains('.m3u8')) return VideoFormat.hls;
    if (combined.contains('.mpd')) return VideoFormat.dash;
    return null;
  }

  int _playbackPriority(MediaSource source) {
    final rendition = source.rendition.trim().toUpperCase();

    if (rendition == 'AUTO' || rendition == 'MASTER') return 0;
    if (_isHlsLikeUrl(source.url) && rendition.isEmpty) return 1;

    switch (rendition) {
      case 'R720':
        return 2;
      case 'R360':
        return 3;
      case 'R1080':
        return 4;
      case 'R4K':
      case 'R2K':
        return 5;
      default:
        return 6;
    }
  }

  int _comparePlaybackSources(MediaSource a, MediaSource b) {
    final byPriority = _playbackPriority(a).compareTo(_playbackPriority(b));
    if (byPriority != 0) return byPriority;
    return a.rendition.compareTo(b.rendition);
  }

  int _reactionCount(String type) => _reactionTotals
      .firstWhere(
        (x) => x.type == type,
        orElse: () => LiveReactionTotal(type: type, count: 0),
      )
      .count;

  Future<void> _submitChat() async {
    if (!_isLiveMode || _chatSending) return;
    final text = _chatController.text.trim();
    if (text.isEmpty) return;

    setState(() => _chatSending = true);
    try {
      final msg = await widget.contentRepository!
          .sendLiveChatMessage(_liveEventId, text);
      if (!mounted) return;
      if (msg != null) {
        setState(() {
          _messages = [..._messages, msg].take(200).toList();
        });
      }
      _chatController.clear();
    } finally {
      if (mounted) setState(() => _chatSending = false);
    }
  }

  Future<void> _emitReaction(String type) async {
    if (!_isLiveMode) return;
    setState(
        () => _burstReactions = [type, ..._burstReactions].take(12).toList());
    unawaited(widget.contentRepository!.sendLiveReaction(_liveEventId, type));
    setState(() {
      final existing = _reactionTotals.where((x) => x.type == type).toList();
      if (existing.isEmpty) {
        _reactionTotals = [
          ..._reactionTotals,
          LiveReactionTotal(type: type, count: 1)
        ];
      } else {
        _reactionTotals = _reactionTotals
            .map((x) => x.type == type
                ? LiveReactionTotal(type: x.type, count: x.count + 1)
                : x)
            .toList();
      }
    });
  }

  void _reportWatchProgress(String eventType) {
    final repo = widget.contentRepository;
    if (repo == null || _isLiveMode) return;
    final c = _controller;
    final positionSec = c?.value.isInitialized == true ? c!.value.position.inSeconds : 0;
    final durationSec =
        (c?.value.isInitialized == true && c!.value.duration > Duration.zero)
            ? c!.value.duration.inSeconds
            : 0;
    final completion =
        durationSec > 0 ? (positionSec / durationSec).clamp(0.0, 1.0) : 0.0;
    unawaited(repo.reportEngagementEvent(
      eventType: eventType,
      titleId: widget.item.id,
      episodeId: widget.episode?.id,
      profileId: widget.profileId,
      completionPercent: completion,
      positionSec: positionSec,
      durationSec: durationSec > 0 ? durationSec : null,
    ));
  }

  void _startProgressTimer() {
    _progressTimer?.cancel();
    _progressTimer = Timer.periodic(const Duration(seconds: 30), (_) {
      if (_controller?.value.isPlaying == true) _reportWatchProgress('SCRUB');
    });
  }

  Future<void> _prepare() async {
    final ep = widget.episode;
    final candidateSources = (ep?.orderedSources.isNotEmpty ?? false)
        ? ep!.orderedSources
        : (widget.item.orderedSources.isNotEmpty
            ? widget.item.orderedSources
            : <MediaSource>[]);

    final orderedCandidates = [...candidateSources]
      ..sort(_comparePlaybackSources);

    final fallbackUrl = ep?.playbackUrl ?? widget.item.playbackUrl;
    _sources = [
      ...orderedCandidates,
      if (fallbackUrl != null && fallbackUrl.isNotEmpty)
        MediaSource(rendition: 'AUTO', url: fallbackUrl),
    ];

    final dedup = <String, MediaSource>{};
    for (final s in _sources) {
      dedup[s.url] = s;
    }
    _sources = dedup.values.toList();

    // AVPlayer on iOS does not support MPEG-DASH; skip those sources.
    if (Platform.isIOS) {
      _sources = _sources
          .where((s) => _inferVideoFormat(s.url) != VideoFormat.dash)
          .toList();
    }

    if (_sources.isEmpty) {
      setState(() {
        _loading = false;
        _error = 'Playback URL unavailable for this content.';
      });
      return;
    }

    await _openSource(0);
  }

  Future<void> _openSource(int idx) async {
    final selected = _sources[idx];
    final requestId = ++_openRequestId;

    if (mounted) {
      setState(() {
        _loading = true;
        _error = null;
        _sourceIndex = idx;
        _showControls = true;
      });
    }

    final uri = Uri.parse(selected.url);
    final formatHint = _inferVideoFormat(selected.url);

    developer.log(
      'Opening playback source index=$idx rendition=${selected.rendition} formatHint=${formatHint?.name ?? 'none'} url=$uri',
      name: 'PlayerPage',
    );

    try {
      final next = formatHint == null
          ? VideoPlayerController.networkUrl(uri)
          : VideoPlayerController.networkUrl(uri, formatHint: formatHint);
      await next.initialize();

      if (_isDisposed || requestId != _openRequestId || !mounted) {
        await next.dispose();
        return;
      }

      final old = _controller;
      old?.removeListener(_onVideoTick);
      _controller = next;

      await next.play();
      next.addListener(_onVideoTick);
      await old?.dispose();
      if (!_didReportPlayStart) {
        _didReportPlayStart = true;
        _reportWatchProgress('PLAY_START');
        _startProgressTimer();
      }

      if (_isDisposed || requestId != _openRequestId || !mounted) {
        await _stopPlayback(disposeController: true);
        return;
      }

      developer.log(
        'Playback source initialized index=$idx rendition=${selected.rendition}',
        name: 'PlayerPage',
      );

      setState(() => _loading = false);
      _restartAutoHideTimer();
      unawaited(_updateWakeLock());
    } catch (err, stackTrace) {
      developer.log(
        'Playback source failed index=$idx rendition=${selected.rendition} url=$uri',
        name: 'PlayerPage',
        error: err,
        stackTrace: stackTrace,
      );

      if (idx < _sources.length - 1 &&
          !_isDisposed &&
          requestId == _openRequestId) {
        await _openSource(idx + 1);
      } else {
        if (mounted && !_isDisposed && requestId == _openRequestId) {
          setState(() {
            _loading = false;
            _error = 'Unable to play selected stream.';
          });
        }
      }
    }
  }

  Future<void> _togglePlayback() async {
    final c = _controller;
    if (c == null || !c.value.isInitialized) return;

    if (c.value.isPlaying) {
      await c.pause();
      _hideControlsTimer?.cancel();
      if (mounted) setState(() => _showControls = true);
      await _updateWakeLock();
    } else {
      await c.play();
      _showControlsTemporarily();
      await _updateWakeLock();
    }
  }

  Future<void> _seekRelative(Duration delta) async {
    final c = _controller;
    if (c == null || !c.value.isInitialized) return;

    final duration = c.value.duration;
    if (duration <= Duration.zero) return;

    final raw = c.value.position + delta;
    final target =
        raw < Duration.zero ? Duration.zero : (raw > duration ? duration : raw);

    await c.seekTo(target);
    _showControlsTemporarily();
  }

  String _formatDuration(Duration value) {
    final safe = value < Duration.zero ? Duration.zero : value;
    final totalSeconds = safe.inSeconds;
    final hours = totalSeconds ~/ 3600;
    final minutes = (totalSeconds % 3600) ~/ 60;
    final seconds = totalSeconds % 60;

    if (hours > 0) {
      return '${hours.toString().padLeft(2, '0')}:${minutes.toString().padLeft(2, '0')}:${seconds.toString().padLeft(2, '0')}';
    }

    return '${minutes.toString().padLeft(2, '0')}:${seconds.toString().padLeft(2, '0')}';
  }

  @override
  Widget build(BuildContext context) {
    final c = _controller;
    final initialized = c != null && c.value.isInitialized;
    final title = widget.episode?.title ?? widget.item.title;
    final position = initialized ? c!.value.position : Duration.zero;
    final duration = initialized ? c!.value.duration : Duration.zero;
    final remaining = duration - position;
    final isBuffering = initialized && c!.value.isBuffering;

    return WillPopScope(
      onWillPop: _onWillPop,
      child: Scaffold(
        backgroundColor: Colors.black,
        body: GestureDetector(
          behavior: HitTestBehavior.opaque,
          onTap: initialized ? _toggleControls : null,
          onVerticalDragStart: initialized
              ? (details) => _handleVerticalDragStart(
                  details, MediaQuery.of(context).size.width)
              : null,
          onVerticalDragUpdate: initialized ? _handleVerticalDragUpdate : null,
          onVerticalDragEnd: initialized ? _handleVerticalDragEnd : null,
          child: Stack(
            children: [
              Positioned.fill(
                child: _loading
                    ? const Center(child: CircularProgressIndicator())
                    : _error != null
                        ? Center(
                            child: Text(_error!, textAlign: TextAlign.center))
                        : (initialized)
                            ? FittedBox(
                                fit: BoxFit.cover,
                                child: SizedBox(
                                  width: c!.value.size.width,
                                  height: c!.value.size.height,
                                  child: VideoPlayer(c!),
                                ),
                              )
                            : const SizedBox.shrink(),
              ),
              if (_showControls || !initialized)
                Positioned.fill(
                  child: Container(color: Colors.black26),
                ),
              if (initialized && isBuffering)
                const Center(
                  child: CircularProgressIndicator(color: Colors.white),
                ),
              if (_showControls)
                Positioned(
                  top: 0,
                  left: 0,
                  right: 0,
                  child: SafeArea(
                    bottom: false,
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 12, vertical: 10),
                      decoration: const BoxDecoration(
                        gradient: LinearGradient(
                          begin: Alignment.topCenter,
                          end: Alignment.bottomCenter,
                          colors: [Color(0xB3000000), Colors.transparent],
                        ),
                      ),
                      child: Row(
                        children: [
                          IconButton(
                            onPressed: () async {
                              await _stopPlayback(disposeController: true);
                              await _restoreSystemUi();
                              if (mounted && context.mounted) {
                                Navigator.of(context).pop();
                              }
                            },
                            icon: const Icon(Icons.arrow_back,
                                color: Colors.white),
                          ),
                          Expanded(
                            child: Text(
                              title,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: const TextStyle(
                                color: Colors.white,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ),
                          if (_isLiveMode)
                            IconButton(
                              onPressed: () => setState(
                                  () => _chatPanelOpen = !_chatPanelOpen),
                              icon: Icon(
                                  _chatPanelOpen
                                      ? Icons.chat_bubble
                                      : Icons.chat_bubble_outline,
                                  color: Colors.white),
                            ),
                          if (_sources.length > 1)
                            PopupMenuButton<int>(
                              tooltip: 'Select quality',
                              color: const Color(0xFF1F1F1F),
                              onSelected: (i) {
                                _showControlsTemporarily();
                                _openSource(i);
                              },
                              itemBuilder: (_) => [
                                for (var i = 0; i < _sources.length; i++)
                                  PopupMenuItem(
                                    value: i,
                                    child: Row(
                                      children: [
                                        if (i == _sourceIndex)
                                          const Padding(
                                            padding:
                                                EdgeInsets.only(right: 8.0),
                                            child: Icon(
                                              Icons.check,
                                              size: 16,
                                              color: AppTokens.brandOrange,
                                            ),
                                          ),
                                        Text(
                                          _sources[i].rendition,
                                          style: const TextStyle(
                                              color: Colors.white),
                                        ),
                                      ],
                                    ),
                                  ),
                              ],
                              icon: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Text(
                                    _sources[_sourceIndex].rendition,
                                    style: const TextStyle(
                                      color: Colors.white,
                                      fontWeight: FontWeight.w600,
                                    ),
                                  ),
                                  const SizedBox(width: 6),
                                  const Icon(Icons.settings,
                                      color: Colors.white),
                                ],
                              ),
                            ),
                        ],
                      ),
                    ),
                  ),
                ),
              if (_showControls && initialized)
                Positioned.fill(
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      _SeekControlButton(
                        icon: Icons.replay_10,
                        onPressed: () => _seekRelative(-_seekStep),
                      ),
                      const SizedBox(width: 44),
                      _SeekControlButton(
                        icon: c!.value.isPlaying
                            ? Icons.pause_circle_filled
                            : Icons.play_circle_fill,
                        size: 70,
                        onPressed: _togglePlayback,
                      ),
                      const SizedBox(width: 44),
                      _SeekControlButton(
                        icon: Icons.forward_10,
                        onPressed: () => _seekRelative(_seekStep),
                      ),
                    ],
                  ),
                ),
              if (_showControls && initialized)
                Positioned(
                  left: 0,
                  right: 0,
                  bottom: 0,
                  child: SafeArea(
                    top: false,
                    child: Container(
                      padding: const EdgeInsets.fromLTRB(14, 8, 14, 12),
                      decoration: const BoxDecoration(
                        gradient: LinearGradient(
                          begin: Alignment.bottomCenter,
                          end: Alignment.topCenter,
                          colors: [Color(0xB3000000), Colors.transparent],
                        ),
                      ),
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Padding(
                            padding: EdgeInsets.only(bottom: 6),
                            child: Row(
                              children: [
                                Icon(Icons.swipe_up_alt,
                                    color: Colors.white60, size: 16),
                                SizedBox(width: 6),
                                Text(
                                  'Swipe up/down on left for brightness, right for volume',
                                  style: TextStyle(
                                      color: Colors.white60, fontSize: 12),
                                ),
                              ],
                            ),
                          ),
                          VideoProgressIndicator(
                            c!,
                            allowScrubbing: true,
                            padding: const EdgeInsets.only(bottom: 8),
                            colors: const VideoProgressColors(
                              playedColor: AppTokens.brandOrange,
                              bufferedColor: Color(0x66FFFFFF),
                              backgroundColor: Color(0x33FFFFFF),
                            ),
                          ),
                          Row(
                            children: [
                              Text(
                                _formatDuration(position),
                                style: const TextStyle(
                                    color: Colors.white70, fontSize: 12),
                              ),
                              const Spacer(),
                              IconButton(
                                onPressed: _toggleMute,
                                icon: Icon(
                                  _muted
                                      ? Icons.volume_off
                                      : Icons.volume_up,
                                  color: Colors.white70,
                                  size: 20,
                                ),
                                padding: EdgeInsets.zero,
                                constraints: const BoxConstraints(),
                              ),
                              const SizedBox(width: 8),
                              Text(
                                '-${_formatDuration(remaining)}',
                                style: const TextStyle(
                                    color: Colors.white70, fontSize: 12),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              if (_isLiveMode && _chatPanelOpen)
                Positioned(
                  top: 0,
                  right: 0,
                  bottom: 0,
                  child: SafeArea(
                    left: false,
                    child: SizedBox(
                      width: MediaQuery.of(context).size.width >= 1200
                          ? 360
                          : MediaQuery.of(context).size.width * 0.42,
                      child: _LiveChatPanel(state: this),
                    ),
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }
}

class _LiveChatPanel extends StatelessWidget {
  const _LiveChatPanel({required this.state});

  final _PlayerPageState state;

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.all(10),
      decoration: BoxDecoration(
        color: const Color(0xE6101010),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: const Color(0xFF2A2A2A)),
      ),
      child: Column(
        children: [
          const Padding(
            padding: EdgeInsets.fromLTRB(12, 10, 12, 6),
            child: Row(
              children: [
                Icon(Icons.chat, color: Colors.white70, size: 16),
                SizedBox(width: 8),
                Text('Live chat',
                    style: TextStyle(
                        color: Colors.white, fontWeight: FontWeight.w600)),
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 10),
            child: Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                for (final item in state._reactionPresets)
                  InkWell(
                    onTap: () => state._emitReaction(item),
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 10, vertical: 6),
                      decoration: BoxDecoration(
                        color: const Color(0xFF1A1A1A),
                        borderRadius: BorderRadius.circular(999),
                        border: Border.all(color: const Color(0xFF3A3A3A)),
                      ),
                      child: Text('$item ${state._reactionCount(item)}',
                          style: const TextStyle(
                              color: Colors.white, fontSize: 12)),
                    ),
                  ),
              ],
            ),
          ),
          const SizedBox(height: 8),
          Expanded(
            child: ListView.builder(
              padding: const EdgeInsets.symmetric(horizontal: 10),
              itemCount: state._messages.length,
              itemBuilder: (_, i) {
                final m = state._messages[i];
                return Container(
                  margin: const EdgeInsets.only(bottom: 8),
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: const Color(0xAA1D1D1D),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: RichText(
                    text: TextSpan(
                      style:
                          const TextStyle(color: Colors.white70, fontSize: 12),
                      children: [
                        TextSpan(
                            text: m.userName,
                            style: const TextStyle(
                                color: Colors.white,
                                fontWeight: FontWeight.w600)),
                        const TextSpan(text: '  '),
                        TextSpan(text: m.message),
                      ],
                    ),
                  ),
                );
              },
            ),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(10, 6, 10, 10),
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: state._chatController,
                    maxLength: 500,
                    minLines: 1,
                    maxLines: state._chatInputExpanded ? 5 : 1,
                    textInputAction: state._chatInputExpanded
                        ? TextInputAction.newline
                        : TextInputAction.send,
                    style: const TextStyle(color: Colors.white),
                    decoration: const InputDecoration(
                      counterText: '',
                      hintText: 'Say something…',
                      hintStyle: TextStyle(color: Colors.white38),
                      filled: true,
                      fillColor: Color(0xFF1A1A1A),
                      border: OutlineInputBorder(borderSide: BorderSide.none),
                      isDense: true,
                    ),
                    onSubmitted: state._chatInputExpanded
                        ? null
                        : (_) => state._submitChat(),
                  ),
                ),
                IconButton(
                  tooltip: state._chatInputExpanded
                      ? 'Collapse chat input'
                      : 'Expand chat input',
                  onPressed: () => state.setState(
                    () => state._chatInputExpanded = !state._chatInputExpanded,
                  ),
                  icon: Icon(
                    state._chatInputExpanded
                        ? Icons.unfold_less
                        : Icons.unfold_more,
                    color: Colors.white70,
                    size: 20,
                  ),
                ),
                FilledButton(
                  onPressed: state._chatSending ? null : state._submitChat,
                  style: FilledButton.styleFrom(
                      backgroundColor: AppTokens.brandOrange),
                  child: const Text('Send'),
                ),
              ],
            ),
          )
        ],
      ),
    );
  }
}

class _SeekControlButton extends StatelessWidget {
  const _SeekControlButton({
    required this.icon,
    required this.onPressed,
    this.size = 52,
  });

  final IconData icon;
  final VoidCallback onPressed;
  final double size;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        color: Color(0x66000000),
        shape: BoxShape.circle,
      ),
      child: IconButton(
        onPressed: onPressed,
        iconSize: size,
        color: Colors.white,
        icon: Icon(icon),
      ),
    );
  }
}
