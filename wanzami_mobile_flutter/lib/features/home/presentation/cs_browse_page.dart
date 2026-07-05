import 'package:flutter/material.dart';

import '../../../core/theme/callsheet_tokens.dart';
import '../../../core/theme/network_image_with_skeleton.dart';
import '../../../core/widgets/callsheet_kit.dart';
import '../../content/data/content_models.dart';
import '../../content/data/content_repository.dart';

/// Browse — "the catalogue". One paper page, FILMS / SERIES segmented like
/// tabs on a production binder.
class CsBrowsePage extends StatefulWidget {
  const CsBrowsePage({
    super.key,
    required this.repository,
    required this.profileId,
    required this.onOpen,
  });

  final ContentRepository repository;
  final String profileId;
  final ValueChanged<MediaItem> onOpen;

  @override
  State<CsBrowsePage> createState() => _CsBrowsePageState();
}

class _CsBrowsePageState extends State<CsBrowsePage> {
  late Future<List<MediaItem>> _future;
  bool _showSeries = false;

  @override
  void initState() {
    super.initState();
    _future = widget.repository.fetchTitles(profileId: widget.profileId);
  }

  Future<void> _refresh() async {
    final next = widget.repository.fetchTitles(profileId: widget.profileId);
    setState(() => _future = next);
    await next;
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      color: CsTokens.paper,
      child: SafeArea(
        bottom: false,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const CsPageHeader(title: 'The catalogue', chip: 'Binder 01'),
            Padding(
              padding: const EdgeInsets.fromLTRB(14, 14, 14, 4),
              child: Row(
                children: [
                  _SegmentTab(
                    label: 'Films',
                    selected: !_showSeries,
                    onTap: () => setState(() => _showSeries = false),
                  ),
                  const SizedBox(width: 8),
                  _SegmentTab(
                    label: 'Series',
                    selected: _showSeries,
                    onTap: () => setState(() => _showSeries = true),
                  ),
                ],
              ),
            ),
            Expanded(
              child: FutureBuilder<List<MediaItem>>(
                future: _future,
                builder: (context, snapshot) {
                  final loading =
                      snapshot.connectionState == ConnectionState.waiting;
                  final all = snapshot.data ?? const <MediaItem>[];
                  final items = all
                      .where((e) => e.isSeries == _showSeries)
                      .toList();

                  if (loading) return const _BrowseSkeleton();

                  return RefreshIndicator(
                    color: CsTokens.rust,
                    onRefresh: _refresh,
                    child: items.isEmpty
                        ? ListView(
                            physics: const AlwaysScrollableScrollPhysics(),
                            padding: const EdgeInsets.all(14),
                            children: const [
                              Center(
                                child: Padding(
                                  padding: EdgeInsets.only(top: 60),
                                  child:
                                      CsSlug('Nothing filed under this tab yet'),
                                ),
                              ),
                            ],
                          )
                        : GridView.builder(
                            physics: const AlwaysScrollableScrollPhysics(),
                            padding:
                                const EdgeInsets.fromLTRB(14, 10, 14, 110),
                            gridDelegate:
                                const SliverGridDelegateWithFixedCrossAxisCount(
                              crossAxisCount: 3,
                              mainAxisSpacing: 12,
                              crossAxisSpacing: 10,
                              childAspectRatio: 2 / 3,
                            ),
                            itemCount: items.length,
                            itemBuilder: (_, i) {
                              final item = items[i];
                              return GestureDetector(
                                onTap: () => widget.onOpen(item),
                                child: CsBox(
                                  borderWidth: 2,
                                  child: Stack(
                                    fit: StackFit.expand,
                                    children: [
                                      NetworkImageWithSkeleton(
                                          url: item.thumbnailUrl,
                                          decodeWidth: 260),
                                      const DecoratedBox(
                                        decoration: BoxDecoration(
                                          gradient: LinearGradient(
                                            begin: Alignment.topCenter,
                                            end: Alignment.bottomCenter,
                                            colors: [
                                              Colors.transparent,
                                              Color(0xCC000000),
                                            ],
                                            stops: [0.6, 1.0],
                                          ),
                                        ),
                                      ),
                                      Positioned(
                                        left: 6,
                                        right: 6,
                                        bottom: 5,
                                        child: Text(
                                          item.title.toUpperCase(),
                                          maxLines: 2,
                                          overflow: TextOverflow.ellipsis,
                                          style: CsTokens.mono(
                                            size: 9,
                                            color: Colors.white,
                                            weight: FontWeight.w700,
                                          ),
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              );
                            },
                          ),
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

class _SegmentTab extends StatelessWidget {
  const _SegmentTab({
    required this.label,
    required this.selected,
    required this.onTap,
  });

  final String label;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Semantics(
      selected: selected,
      button: true,
      child: GestureDetector(
        onTap: onTap,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 160),
          curve: Curves.easeOut,
          constraints: const BoxConstraints(minHeight: 40),
          padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 8),
          decoration: BoxDecoration(
            color: selected ? CsTokens.ink : CsTokens.paper,
            border: CsTokens.border(2),
          ),
          child: Text(
            label.toUpperCase(),
            style: TextStyle(
              color: selected ? CsTokens.brand : CsTokens.ink,
              fontSize: 12,
              fontWeight: FontWeight.w800,
              letterSpacing: 0.9,
            ),
          ),
        ),
      ),
    );
  }
}

class _BrowseSkeleton extends StatelessWidget {
  const _BrowseSkeleton();

  @override
  Widget build(BuildContext context) {
    return GridView.builder(
      padding: const EdgeInsets.fromLTRB(14, 10, 14, 110),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 3,
        mainAxisSpacing: 12,
        crossAxisSpacing: 10,
        childAspectRatio: 2 / 3,
      ),
      itemCount: 9,
      itemBuilder: (_, __) => Container(
        decoration: BoxDecoration(
          color: CsTokens.panel,
          border: CsTokens.border(2),
        ),
      ),
    );
  }
}
