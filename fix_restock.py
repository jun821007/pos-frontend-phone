import re

path = 'index.html'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

pattern = re.compile(
    r"(UI\.rsMode = m;).+?', 'setRestockMode'\);\s*UI\.rsMode = m;\s*",
    re.DOTALL
)
new_content = pattern.sub(r'\1 ', content)

if new_content != content:
    with open(path, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print('Fixed')
else:
    alt = re.sub(
        r"(function setRestockMode\(m\) \{ UI\.rsMode = m;)[^c]+(const ri=)",
        r'\1 \2',
        content
    )
    if alt != content:
        with open(path, 'w', encoding='utf-8') as f:
            f.write(alt)
        print('Fixed via fallback')
    else:
        print('No match')
