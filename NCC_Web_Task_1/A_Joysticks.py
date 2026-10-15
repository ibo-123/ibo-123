n , m = map(int, input().split())
coun = 0
while n > 0 and m > 0 and max(n, m) > 1:
    if n >= m:
        n -= 2
        m += 1
        coun += 1
    else:
        m -= 2
        n += 1
        coun += 1
print(coun)