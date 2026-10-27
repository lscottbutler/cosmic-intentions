# Cosmic Intentions backup recovery — 2026-10-27 (Asia/Bangkok)

## Authority and safety
Scott explicitly requested completing the backup rather than reporting checkpoints. This recovery work uses the existing private repository, existing approved OneDrive/Google Drive destinations, and existing GitHub Actions secrets. Production application code, database contents, access settings and secret values were not changed. No secrets or member data are included in this report.

## Verified capture
- Baseline main: `5deeeb6aaeffdbde8c0037774eefc860400594bf` (verified unchanged during recovery).
- Recovery branch: `review/backup-recovery-20261027`.
- Actual snapshot source commit: `b2e4df23ca91fa899cd2f406ad4e3b226226c81a`, which contains the baseline application and backup-only improvements.
- Capture workflow: `40442206185`, job `121984934117`.
- Capture completed on October 27, 2026, before 10:09 ICT.
- Payload: source ZIP, complete Git bundle/history, custom-format PostgreSQL database dump, roles without role passwords, Storage inventory/bucket metadata, all 3 inventoried Storage objects, recovery instructions and SHA-256 payload manifest.
- Checks before upload: source ZIP integrity, Git bundle validation, database dump table-of-contents parsing, stable Storage inventory before/after capture, AES-256 GPG encryption, decryption compared byte-for-byte against the original archive, and encrypted-file SHA-256.
- OneDrive `CI-Backups`: upload and downloaded-content verification PASS (10:08:48 ICT).
- Private GitHub emergency artifact `12706576639`: 943,273,844 bytes; ZIP SHA-256 `e4b51184dfafa2b3ac308ccb0373cb9ad0783928358c0c6f16fb27278592cc27`. Retention expires 2026-11-26. This is ciphertext plus its checksum, not plaintext data.

## Google Drive recovery transfer
The scheduled rclone Google Drive authorization returns `invalid_grant` (expired/revoked). The independently connected Google Drive tool can access the approved private folder.
- Approved backup folder: `12OTW3LTrzHNFhKChvFooCUPxnFbP6HwD`.
- Approved encrypted subfolder: `11Xv6NK8sUep93Bbf5579H4Xd5PHAeb4x`.
- Both folders verified owner-only / shared=false before transfer.
- First retrieval/reassembly workflow `40442904536` PASSED. It independently downloaded the OneDrive ciphertext, checked SHA-256 and verified byte-for-byte part reassembly.
- GitHub download connector limit: 512 MiB; Drive file transfer limit: 100 MiB. No originals deleted after either limit was encountered.
- Workflow `40443993799` repackages the SAME encrypted snapshot into ten 90-MiB-or-smaller parts, each with the full manifest, original ciphertext checksum and recovery instructions. It does not recapture or write production data.
- Drive upload/verification is IN PROGRESS at this checkpoint. Do not claim it completed until all ten files and permissions are verified.

## Recovery and limitations
Keep every numbered ZIP of the ten-part set together. Extract to a private directory, verify each part against PARTS-MANIFEST.json, concatenate in numerical order, verify the whole ciphertext SHA-256, then decrypt using the existing approved passphrase store. Never request or log the passphrase. Verify the internal manifest before restoring in an isolated environment.

The backup is an actual capture, not merely a Git branch. However, a full isolated database/application restore has NOT been performed. Provider-managed configuration outside the database and repository, and unsynchronized files on Scott's Windows computer, have not been independently exported by this job. Bible copies remain separately preserved in the private Drive backup records. The automatic Google Drive authorization is still broken; current transfer recovery does not repair that authorization.

## Implementation verification
Three synthetic local scenarios passed: Drive failure, both destinations failing, both succeeding. In each, both remotes were attempted and verified ciphertext survived temporary-directory cleanup. Real capture independently verified OneDrive and retained the encrypted artifact after Drive failure. All changes remain on the recovery branch; no production merge or deployment was performed.
