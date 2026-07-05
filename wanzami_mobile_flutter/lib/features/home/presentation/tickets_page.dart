import 'package:flutter/material.dart';

import '../../../core/theme/callsheet_tokens.dart';
import '../../../core/theme/network_image_with_skeleton.dart';
import '../../../core/widgets/callsheet_kit.dart';
import '../../content/data/content_models.dart';
import '../../content/data/content_repository.dart';

/// My Tickets — the library as a stack of ADMITTED ticket stubs.
class TicketsPage extends StatefulWidget {
  const TicketsPage({
    super.key,
    required this.repository,
    required this.profileId,
    required this.onOpen,
  });

  final ContentRepository repository;
  final String profileId;
  final ValueChanged<MediaItem> onOpen;

  @override
  State<TicketsPage> createState() => _TicketsPageState();
}

class _TicketsPageState extends State<TicketsPage> {
  late Future<List<PpvTicket>> _future;

  @override
  void initState() {
    super.initState();
    _future = widget.repository.fetchMyPpvTickets(profileId: widget.profileId);
  }

  Future<void> _refresh() async {
    final next = widget.repository.fetchMyPpvTickets(profileId: widget.profileId);
    setState(() => _future = next);
    await next;
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      color: CsTokens.paper,
      child: SafeArea(
        bottom: false,
        child: FutureBuilder<List<PpvTicket>>(
          future: _future,
          builder: (context, snapshot) {
            final loading =
                snapshot.connectionState == ConnectionState.waiting;
            final failed = snapshot.hasError;
            final tickets = snapshot.data ?? const <PpvTicket>[];

            return Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                CsPageHeader(
                  title: 'My tickets',
                  chip: loading ? '···' : '${tickets.length} active',
                ),
                Expanded(
                  child: RefreshIndicator(
                    color: CsTokens.rust,
                    onRefresh: _refresh,
                    child: loading
                        ? const _TicketsSkeleton()
                        : ListView(
                            physics: const AlwaysScrollableScrollPhysics(),
                            padding: const EdgeInsets.fromLTRB(14, 16, 14, 110),
                            children: [
                              if (failed)
                                const _TicketsEmpty(
                                  slug: 'Box office unreachable',
                                  body:
                                      'We could not load your tickets. Pull down to try again.',
                                )
                              else if (tickets.isEmpty)
                                const _TicketsEmpty(
                                  slug: 'No stubs yet',
                                  body:
                                      'When you buy a film, your ticket lives here — stamped, dated, and ready to watch for 30 days.',
                                )
                              else ...[
                                for (final ticket in tickets) ...[
                                  _TicketStub(
                                    ticket: ticket,
                                    onTap: () => widget.onOpen(ticket.item),
                                  ),
                                  const SizedBox(height: 16),
                                ],
                              ],
                              const SizedBox(height: 8),
                              Container(
                                padding: const EdgeInsets.all(14),
                                decoration: BoxDecoration(
                                  border: Border.all(
                                    color: CsTokens.ink,
                                    width: 2,
                                    style: BorderStyle.solid,
                                  ),
                                ),
                                child: Center(
                                  child: CsSlug(
                                    'Downloads · coming to this counter soon',
                                    size: 10,
                                  ),
                                ),
                              ),
                            ],
                          ),
                  ),
                ),
              ],
            );
          },
        ),
      ),
    );
  }
}

class _TicketStub extends StatelessWidget {
  const _TicketStub({required this.ticket, required this.onTap});

  final PpvTicket ticket;
  final VoidCallback onTap;

  String get _expiryLabel {
    final days = ticket.daysLeft;
    if (days == null) return 'Access active';
    if (days <= 0) return 'Expires today';
    if (days == 1) return 'Expires tomorrow';
    return 'Expires in $days days';
  }

  @override
  Widget build(BuildContext context) {
    return Semantics(
      button: true,
      label: '${ticket.item.title}. $_expiryLabel.',
      child: GestureDetector(
        onTap: onTap,
        child: Stack(
          clipBehavior: Clip.none,
          children: [
            Container(
              decoration: BoxDecoration(
                color: CsTokens.panel,
                border: CsTokens.border(CsTokens.borderWidthHeavy),
                boxShadow: CsTokens.hardShadow(4),
              ),
              child: IntrinsicHeight(
                child: Row(
                  children: [
                    SizedBox(
                      width: 64,
                      child: NetworkImageWithSkeleton(
                          url: ticket.item.thumbnailUrl, decodeWidth: 128),
                    ),
                    Expanded(
                      child: Padding(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 12, vertical: 12),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Text(
                              ticket.item.title.toUpperCase(),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: CsTokens.display(size: 20),
                            ),
                            const SizedBox(height: 3),
                            CsSlug(_expiryLabel, size: 10),
                          ],
                        ),
                      ),
                    ),
                    CustomPaint(
                      size: const Size(2, double.infinity),
                      painter: _StubDashPainter(),
                    ),
                    const Padding(
                      padding: EdgeInsets.symmetric(horizontal: 10),
                      child: CsStamp('Admitted'),
                    ),
                  ],
                ),
              ),
            ),
            const Positioned(left: -9, top: 0, bottom: 0, child: _StubNotch()),
            const Positioned(right: -9, top: 0, bottom: 0, child: _StubNotch()),
          ],
        ),
      ),
    );
  }
}

class _StubNotch extends StatelessWidget {
  const _StubNotch();

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Container(
        width: 16,
        height: 16,
        decoration: BoxDecoration(
          color: CsTokens.paper,
          shape: BoxShape.circle,
          border: Border.all(color: CsTokens.ink, width: 3),
        ),
      ),
    );
  }
}

class _StubDashPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = CsTokens.ink
      ..strokeWidth = 2;
    const dash = 5.0;
    const gap = 4.0;
    var y = 0.0;
    final x = size.width / 2;
    while (y < size.height) {
      final end = (y + dash) > size.height ? size.height : (y + dash);
      canvas.drawLine(Offset(x, y), Offset(x, end), paint);
      y += dash + gap;
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

class _TicketsEmpty extends StatelessWidget {
  const _TicketsEmpty({required this.slug, required this.body});

  final String slug;
  final String body;

  @override
  Widget build(BuildContext context) {
    return CsBox(
      color: CsTokens.panel,
      padding: const EdgeInsets.all(18),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          CsSlug(slug),
          const SizedBox(height: 6),
          Text(body, style: CsTokens.body),
        ],
      ),
    );
  }
}

class _TicketsSkeleton extends StatelessWidget {
  const _TicketsSkeleton();

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.fromLTRB(14, 16, 14, 110),
      children: [
        for (var i = 0; i < 3; i++) ...[
          Container(
            height: 76,
            decoration: BoxDecoration(
              color: CsTokens.panel,
              border: CsTokens.border(2),
            ),
          ),
          const SizedBox(height: 16),
        ],
      ],
    );
  }
}
