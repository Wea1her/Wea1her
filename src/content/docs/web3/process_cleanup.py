
import re

input_file = r"d:\me\Wea1her\src\content\docs\web3\09.md"

with open(input_file, 'r', encoding='utf-8') as f:
    content = f.read()

# Remove timestamps from headers: ## Title (01:23) -> ## Title
# Also handle invisible chars if any remaining
content = re.sub(r'^(#+ .*?)[\(（]\d{2}:\d{2}[\)）].*?$', r'\1', content, flags=re.MULTILINE)

# Ensure one blank line before headers (except at start of file)
# First, remove multiple blank lines
content = re.sub(r'\n{3,}', '\n\n', content)

# Check for headers without preceding blank line
# This regex looks for non-newline followed by newline then header
# We replace it with \1\n\n\2
content = re.sub(r'([^\n])\n(#+ )', r'\1\n\n\2', content)

with open(input_file, 'w', encoding='utf-8') as f:
    f.write(content)
