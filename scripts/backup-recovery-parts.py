"""Split the specified encrypted backup only; no decryption or production writes."""
import hashlib, json, pathlib, shutil, sys
root=pathlib.Path(sys.argv[1]); size=int(sys.argv[2]) if len(sys.argv)>2 else 450*1024*1024
files=list((root/'incoming').glob('*-40442206185-1.tar.gz.gpg'))
assert len(files)==1, 'Expected exactly one encrypted backup'
source=files[0]
checksum=source.with_name(source.name+'.sha256')
assert checksum.is_file()
def digest(path):
    h=hashlib.sha256()
    with path.open('rb') as f:
        for b in iter(lambda:f.read(8*1024*1024), b''): h.update(b)
    return h.hexdigest()
expected=checksum.read_text().split()[0]
assert digest(source)==expected, 'Ciphertext checksum mismatch'
parts=[]
with source.open('rb') as f:
    i=0
    while True:
        block=f.read(size)
        if not block: break
        folder=root/f'part-{i:02d}';folder.mkdir()
        dest=folder/(source.name+f'.part-{i:02d}')
        dest.write_bytes(block)
        parts.append({'name':dest.name,'bytes':len(block),'sha256':hashlib.sha256(block).hexdigest()})
        i+=1
assert len(parts)==2, 'Expected two connector-sized parts'
h=hashlib.sha256()
for i,item in enumerate(parts):
    p=root/f'part-{i:02d}'/item['name']
    with p.open('rb') as f:
        for b in iter(lambda:f.read(8*1024*1024), b''):h.update(b)
assert h.hexdigest()==expected, 'Part reassembly failed'
manifest={'source_workflow_run':40442206185,'encrypted_file':source.name,'encrypted_sha256':expected,'parts':parts,'note':'Both parts are required. Ciphertext only; no password or raw database included.'}
readme='COSMIC INTENTIONS ENCRYPTED RECOVERY\n\nKeep both ZIP files together. Extract each ZIP into the same empty private folder. Check each part SHA256 against PARTS-MANIFEST.json. Concatenate .part-00 then .part-01 in byte order into the original encrypted filename. Verify its SHA256 against the enclosed .sha256 file BEFORE decryption. Obtain the existing backup passphrase only from its approved private secret store. Never paste it into chat or logs. Decrypt in a private recovery environment and verify SHA256-MANIFEST.json inside the payload. The payload includes source.zip, repository.bundle, database.dump, roles.sql (no role passwords), stored objects, storage inventories, and READ-ME-FIRST.md. Restore only to an isolated recovery target, never over production. This packaging task verifies downloaded ciphertext and reassembly, not a complete database restore.\n'
for i in range(len(parts)):
    p=root/f'part-{i:02d}'
    (p/'PARTS-MANIFEST.json').write_text(json.dumps(manifest,indent=2)+'\n')
    (p/'READ-ME-FIRST.txt').write_text(readme)
    shutil.copy2(checksum,p/checksum.name)
print('Downloaded encrypted archive checksum verified; both parts reassembled byte-for-byte.')
