from pathlib import Path
import re, json, hashlib, sys

root = Path(__file__).resolve().parents[1]
source = root / 'floot'
errors = []
patterns = [r'gh[pousr]_[A-Za-z0-9]{30,}', r'github_pat_[A-Za-z0-9_]{30,}', r'-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----', r'sk-[A-Za-z0-9_-]{32,}', r'AKIA[A-Z0-9]{16}', r'[?&]ptoken=']
for path in source.rglob('*'):
    if not path.is_file():
        continue
    text = path.read_text(encoding='utf-8')
    for pattern in patterns:
        if re.search(pattern, text):
            errors.append(f'Potential secret in {path.relative_to(root)} (value redacted)')
    if path.suffix in ['.ts', '.tsx']:
        for ref in re.findall(r'(?:from\s+|import\s*)[\"\'](\.[^\"\']+)[\"\']', text):
            target = path.parent / ref
            candidates = [target] + [Path(str(target) + ext) for ext in ['.ts', '.tsx', '.css', '.json']]
            if not any(p.is_file() for p in candidates):
                errors.append(f'Missing import: {path.relative_to(root)} -> {ref}')
manifest = json.loads((root / 'source-manifest.json').read_text(encoding='utf-8'))
for name, expected in manifest['sha256'].items():
    path = root / name
    if not path.is_file() or hashlib.sha256(path.read_bytes()).hexdigest() != expected:
        errors.append('Missing or modified source snapshot: ' + name)
print('\n'.join(errors) if errors else f'PASS: {len(manifest["sha256"])} source files; relative imports resolved; no known token patterns detected.')
sys.exit(1 if errors else 0)
