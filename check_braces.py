import sys

def check_braces(filename):
    with open(filename, 'r', encoding='utf-8') as f:
        content = f.read()
    
    stack = []
    line_num = 1
    col_num = 0
    in_string = None
    in_comment = False
    in_template = False
    
    for i, char in enumerate(content):
        col_num += 1
        if char == '\n':
            line_num += 1
            col_num = 0
            if in_comment == 'single':
                in_comment = False
            continue
        
        if in_comment == 'multi':
            if char == '*' and i + 1 < len(content) and content[i+1] == '/':
                in_comment = False
                # Skip the next char
            continue
        
        if not in_string and not in_comment and not in_template:
            if char == '/' and i + 1 < len(content):
                if content[i+1] == '/':
                    in_comment = 'single'
                    continue
                if content[i+1] == '*':
                    in_comment = 'multi'
                    continue
        
        if in_comment:
            continue
            
        if char == '"' or char == "'":
            if not in_string:
                in_string = char
            elif in_string == char:
                # Check for escaped char
                if content[i-1] != '\\':
                    in_string = None
            continue
            
        if in_string:
            continue

        if char == '`':
            if not in_template:
                in_template = True
            else:
                if content[i-1] != '\\':
                    in_template = False
            continue
            
        if in_template:
            # Check for ${ }
            if char == '$' and i + 1 < len(content) and content[i+1] == '{':
                stack.append(('${', line_num, col_num))
            elif char == '}' and stack and stack[-1][0] == '${':
                stack.pop()
            continue

        if char == '{':
            stack.append(('{', line_num, col_num))
        elif char == '}':
            if not stack:
                print(f"Extra closing brace at line {line_num}, col {col_num}")
            else:
                type, l, c = stack.pop()
                if type != '{':
                   print(f"Mismatched brace at line {line_num}, col {col_num}: expected {type} close")

    for type, l, c in stack:
        print(f"Unclosed {type} opened at line {l}, col {c}")

if __name__ == "__main__":
    check_braces(sys.argv[1])
