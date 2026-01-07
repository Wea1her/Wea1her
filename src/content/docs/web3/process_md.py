
import re
import os

input_file = r"d:\me\Wea1her\src\content\docs\web3\09.md"
output_file = r"d:\me\Wea1her\src\content\docs\web3\09_optimized.md"

cn_num = {
    '一': 1, '二': 2, '三': 3, '四': 4, '五': 5,
    '六': 6, '七': 7, '八': 8, '九': 9, '十': 10,
    '十一': 11, '十二': 12, '十三': 13, '十四': 14, '十五': 15,
    '十六': 16, '十七': 17, '十八': 18, '十九': 19, '二十': 20
}

def replace_cn_header(match):
    num_str = match.group(1)
    title = match.group(2)
    if num_str in cn_num:
        return f"### {cn_num[num_str]}. {title}"
    return match.group(0)

with open(input_file, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Fix Image Links ![[...]] -> ![](images/...)
content = re.sub(r'!\[\[(.*?)\]\]', r'![](images/\1)', content)

# 2. Remove Timestamps (e.g. ﻿01:56﻿)
# The char might be \ufeff
content = re.sub(r'[\ufeff]*\d{2}:\d{2}[\ufeff]*', '', content)

lines = content.split('\n')
new_lines = []
in_part_2 = False
part_2_started = False

for line in lines:
    # Detect start of Part 2
    if "#### 一、Viem介绍" in line:
        in_part_2 = True
        if not part_2_started:
            new_lines.append("")
            new_lines.append("## 五、课程笔记与补充")
            new_lines.append("")
            part_2_started = True
    
    if in_part_2:
        # Promote H4 to H3 and change numbering
        # Match #### 一、Title
        match_h4 = re.match(r'^#### ([一二三四五六七八九十]+)、(.*)', line)
        if match_h4:
            num = match_h4.group(1)
            title = match_h4.group(2).strip()
            if num in cn_num:
                new_lines.append(f"### {cn_num[num]}. {title}")
                continue
        
        # Promote H5 to H4 and change numbering
        # Match ##### 1. Title -> #### 1）Title
        match_h5 = re.match(r'^##### (\d+)\. (.*)', line)
        if match_h5:
            num = match_h5.group(1)
            title = match_h5.group(2).strip()
            new_lines.append(f"#### {num}）{title}")
            continue
            
    new_lines.append(line)

output_content = '\n'.join(new_lines)

# Fix double empty lines
output_content = re.sub(r'\n{3,}', '\n\n', output_content)

with open(output_file, 'w', encoding='utf-8') as f:
    f.write(output_content)

print(f"Optimized file written to {output_file}")
