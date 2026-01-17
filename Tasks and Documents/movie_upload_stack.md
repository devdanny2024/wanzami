Title: Movie Upload Architecture, Tech Stack, and Flow
Date: 2026-01-15
Author: Olukayode Soliu

Overview
This document describes the movie upload system, related services, storage, processing pipeline, and the frontend UX for uploads and playback.

Repositories and Apps
- Admin (Admin/): Content management UI (uploads, metadata, queue, processes).
- Web App (Wanzami/): Consumer playback UI, player, trailers, and browsing.
- Backend (backend/): API, upload orchestration, transcode worker, queue, and storage integrations.

Core Tech Stack
Frontend
- React + Next.js (Admin and Web).
- Tailwind CSS for styling.
- HLS playback via hls.js in the custom player.

Backend
- Node.js (TypeScript), Express.
- Prisma ORM for database access.
- BullMQ for background processing (transcode queue).
- Redis/Valkey for BullMQ backing store.

Storage and Delivery
- Amazon S3 for raw uploads, assets, and HLS output.
- CloudFront CDN for faster delivery of media (MEDIA_CDN_BASE).

Transcoding
- ffmpeg for HLS renditions.
- Output renditions: R360, R720, R1080, R2K, R4K.
- Segmented HLS output stored under vod/{uploadJobId}/ in S3.

Primary Data Models (Conceptual)
- Title: Movie or Series metadata.
- Episode: Episode metadata for Series.
- UploadJob: Upload and transcode job tracking.
- AssetVersion: Rendition output and status (PROCESSING/READY).

Upload Flow (Admin)
1) Admin selects media assets and metadata.
2) Admin calls init upload:
   - Endpoint: POST /admin/uploads/init
   - Creates UploadJob with status UPLOADING.
   - Returns multipart S3 presigned URLs.
3) Browser uploads parts directly to S3 (multipart upload).
4) Progress updates:
   - Endpoint: PATCH /admin/uploads/:id/progress
   - Tracks bytesUploaded in UploadJob.
5) Complete upload:
   - Endpoint: POST /admin/uploads/:id/complete
   - Completes S3 multipart upload.
   - Marks AssetVersion entries as PROCESSING.
   - Enqueues transcode job in BullMQ.
   - Sets UploadJob to PROCESSING.

Resume Support (Admin)
- Resume endpoint: POST /admin/uploads/:id/resume
- Uses ListParts to compute missing parts and presigns remaining URLs.
- Client can resume multipart upload after disruption using stored upload session metadata.

Transcode Flow (Worker)
1) Worker receives job from BullMQ (queue: "transcode").
2) Downloads original source from S3.
3) Generates HLS for configured renditions.
4) Uploads playlist + segments to S3 under vod/{uploadJobId}/.
5) Updates AssetVersion records to READY and sets URL for playback.
6) Updates UploadJob to COMPLETED.

Processes and Monitoring (Admin)
- Processes page pulls /admin/uploads
- Shows PROCESSING/COMPLETED/FAILED jobs.
- Processing percent is derived from AssetVersion READY vs total renditions.
- Restart/Retry endpoint: POST /admin/uploads/:id/retry

Playback Flow (Web App)
1) Web app loads title and asset versions.
2) Player selects best rendition, prefers HLS (.m3u8) where available.
3) CustomMediaPlayer handles:
   - HLS playback via hls.js.
   - Quality switching (source swap).
   - Seek handling and auto-resume.
   - Buffering indicator.
4) Trailers:
   - Short trailer plays in the detail hero.
   - Full trailer plays in modal and pauses short trailer.

Key Storage Paths
- uploads/: Raw uploaded files (source).
- vod/{uploadJobId}/: HLS output (playlist and segments).
- poster/: Posters.
- thumbnail/: Thumbnails.
- trailer/: Trailer uploads.
- wanzami_assets/: Logos and misc assets.

Environment Variables (Core)
Backend
- AUTH_SERVICE_URL / NEXT_PUBLIC_API_BASE: API base URL.
- MEDIA_CDN_BASE: CloudFront base URL for media delivery.
- S3_REGION, S3_BUCKET, S3_ENDPOINT (if used).
- S3_MULTIPART_PART_SIZE_MB: Multipart chunk size.
- S3_ACCELERATE: Enables transfer acceleration (bucket config required).

Admin/Web
- NEXT_PUBLIC_API_BASE / NEXT_PUBLIC_API_BASE_URL: API base URL.
- NEXT_PUBLIC_UPLOAD_MAX_CONCURRENCY: Upload concurrency limit.

Security and Access
- Admin endpoints require auth + admin middleware.
- S3 writes are via presigned URLs (browser direct upload).
- Public read for delivery assets via CloudFront and bucket policies.

Operational Notes
- Large file uploads use multipart upload with configurable part size.
- Transcodes are long-running; worker lock duration is extended.
- Processing percent uses AssetVersion readiness, not ffmpeg internal percent.

Verification Checklist
Upload
- Init upload returns partCount and presigned URLs.
- Progress updates reflected in UploadJob.
- Completion triggers transcode job.

Processing
- Process list shows job as PROCESSING with percent > 0 once renditions complete.
- Completed job shows AssetVersion URLs under vod/{uploadJobId}/.

Playback
- Player loads HLS playlist from CDN.
- Quality switching resumes playback automatically.
- Short trailer pauses when full trailer modal opens.

Known Constraints
- Orientation lock depends on browser support.
- HLS percent is derived from finished renditions, not per-segment progress.

Appendix: Related Files
- backend/src/controllers/uploadController.ts
- backend/src/worker/transcodeWorker.ts
- backend/src/queues/transcodeQueue.ts
- backend/src/upload/s3.ts
- Wanzami/src/components/CustomMediaPlayer.tsx
- Admin/src/context/UploadQueueProvider.tsx
- Admin/src/components/ProcessManagement.tsx
