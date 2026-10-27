# Cosmic Intentions backup recovery — 2026-10-27 (Asia/Bangkok)

## Authority and safety
Scott explicitly requested completing the backup rather than reporting checkpoints. This recovery work uses the existing private repository, approved OneDrive/Google Drive destinations, and existing GitHub Actions secrets. Production application code, database contents, access settings and secret values were not changed. No secrets or member data are included in this report.

## Verified capture
- Baseline main: `5deeeb6aaeffdbde8c0037774eefc860400594bf` (verified unchanged during recovery).
- Recovery branch: `review/backup-recovery-20261027`.
- Actual snapshot source commit: `b2e4df23ca91fa899cd2f406ad4e3b226226c81a`, containing the baseline application and backup-only improvements.
- Capture workflow: `40442206185`, job `121984934117`.
- Capture completed October 27, 2026, before 10:09 ICT.
- Payload: source ZIP, complete Git bundle/history, custom-format PostgreSQL database dump, roles without role passwords, Storage inventory/bucket metadata, all 3 inventoried Storage objects, recovery instructions and SHA-256 payload manifest.
- Checks before upload: source ZIP integrity, Git bundle validation, database dump table-of-contents parsing, stable Storage inventory before/after capture, AES-256 GPG encryption, decryption compared byte-for-byte with the original archive, and encrypted-file SHA-256.
- OneDrive `CI-Backups`: upload and downloaded-content verification PASS (10:08:48 ICT).
- Private GitHub emergency artifact `12706576639`: 943,273,844 bytes; ZIP SHA-256 `e4b51184dfafa2b3ac308ccb0373cb9ad0783928358c0c6f16fb27278592cc27`. Retention expires 2026-11-26. Ciphertext plus checksum only, not plaintext data.

## Google Drive recovery transfer — UPLOADED AND METADATA VERIFIED
The scheduled rclone Google Drive authorization still returns `invalid_grant` (expired/revoked). Transfer was completed through the independently connected Google Drive tool without exposing secrets or weakening folder privacy.
- Approved backup folder: `12OTW3LTrzHNFhKChvFooCUPxnFbP6HwD`.
- Encrypted subfolder: `11Xv6NK8sUep93Bbf5579H4Xd5PHAeb4x`.
- Both folders verified owner-only / shared=false before transfer.
- Retrieval/reassembly workflow `40442904536` PASSED: independently downloaded OneDrive ciphertext, checked SHA-256 and verified byte-for-byte reassembly.
- GitHub download limit: 512 MiB; Drive transfer limit: 100 MiB. Original archives were preserved.
- Workflow `40443993799`, job `121990761285`, PASSED all steps: downloaded the same encrypted snapshot, verified its checksum and ten-part reassembly, then created ten 90-MiB-or-smaller artifacts with full manifest, checksum and recovery instructions. No database recapture or writes.
- All ten ZIPs uploaded into the private encrypted folder; folder read-back confirmed every name, expected byte size and shared=false. Parts 01–09 are each 94,375,852 bytes; part 10 is 93,930,754 bytes.
- Drive connector metadata did not expose content hashes. Therefore Drive verification is upload receipt + independent metadata read-back, NOT an independent downloaded-byte checksum comparison. The source artifacts and OneDrive ciphertext did pass checksum/download verification.

| ZIP suffix | Google Drive file ID | Source artifact ID | Expected ZIP SHA-256 |
|---|---|---|---|
| part-01-of-10.zip | 1K96g0FQry2TQ2CbUCtfKTz-6ktJ9cso6 | 12707233299 | b1c1215465330763eed247e677bb0bf65404d6f73b01380d5287dc2418445820 |
| part-02-of-10.zip | 1Kx_tHO-0uv5foHoAcZGQBKxGI46Ceicc | 12706688892 | ea726f2c8020b5828583f1968184cba775ea84a586b2898c316d3deda1cb7464 |
| part-03-of-10.zip | 1eaikONaca9JU2cWLh55_xTAYTXBpfzkw | 12706589061 | 8f174583aa724a2540bbbac1b43ae2c1140ce8595c64e5840a23dc7845748767 |
| part-04-of-10.zip | 1wiFFJr0Y46Xjs-2S1KWkNfCVTR6UQ-So | 12707063485 | cab0a0f6b43656b816a59545f1b1c8dd0b720c08d1eda3b0e49aa31f1dffb473 |
| part-05-of-10.zip | 16FckIiu52082KdyVEZWtcwhH-7h08Wqy | 12707043517 | 20a1cf168751f753ca020c31a7d44dc17af83abf52bede94df544dd6453a2c02 |
| part-06-of-10.zip | 1cO60XSqmax6n7jTvF4mzPTqPqE8S0Fjj | 12706578986 | 9cbdb0f0b53faf44bd1fef4adff7bc00fc3952d9ba94857806bd3c00d97173d1 |
| part-07-of-10.zip | 1mv-Y4-TJJHN-jS__LhDdbhbpSLSgcLIT | 12706763685 | ec8c3d2ec72abcd83a071cf968ad31a4510844fc0617fe4d7a1926a32ca4c984 |
| part-08-of-10.zip | 1vuUeVwH1YMVTghzH4MRLOvuhoWXZs7Tp | 12707123368 | 83bdccaa748273f6e92fc24ee34e5119c1a3960bca6092baf934bfeee77b45cb |
| part-09-of-10.zip | 1mlZGBJ8OMQPKXCkspRd_2I-oUysD_hak | 12707133404 | 742352d40e935ffe9b41a7fef4d5e0d007a83e720c3e6ddef3ec92d1979451ff |
| part-10-of-10.zip | 1nG09hb49HlqzXul-tYydGTraQDc6pXCw | 12707228409 | 523435cf5d2c5cdddc6c7ef7ec513d14434057acb959a2001c8a2f0f431b9e4d |

All ZIP names begin `CI-backup-20261027-`. All ten are required for the Drive recovery set.

## Recovery and limitations
Keep all ten numbered ZIPs together. Extract into a private directory, verify each encrypted part against PARTS-MANIFEST.json, concatenate in numerical order, verify the whole ciphertext SHA-256, then decrypt using the existing approved passphrase store. Never request or log the passphrase. Verify the internal manifest before restoring in an isolated environment. Never restore over production as a test.

This is an actual code/database/Storage capture, not merely a Git branch. A full isolated database/application restore has NOT been performed. Provider-managed configuration outside the database and repository, and unsynchronized files on Scott's Windows computer, have not been independently exported by this job. Bible copies remain separately preserved in private Drive records. The automatic Google Drive authorization is still broken; this successful manual transfer does not repair that authorization. Backup-script improvements remain on the recovery branch and are not yet the scheduled main workflow.

## Implementation verification
Three synthetic local scenarios passed: Drive failure, both destinations failing, both succeeding. Both remotes were attempted and verified ciphertext survived temporary cleanup. Real capture verified OneDrive and retained the encrypted artifact after Drive failure. All changes remain on the recovery branch; no production merge/deployment was performed. Full physical restore and Drive downloaded-byte verification remain explicitly outstanding.
