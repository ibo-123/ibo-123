for _ in range(int(input())):
        n = int(input())
        s = input()
        truth = False
        idx = n
        coun = 1
        single = False
        for i in range(1, n):
                if i < n - 1 and not truth and s[i] != s[i - 1] and s[i - 1] == s[i + 1]:
                        truth = True
                        idx = i + 1
                elif truth and i != idx and s[i] != s[i - 1]:
                        coun += 1
                elif not truth and s[i] != s[i - 1]:
                        coun += 1
                if i < n - 1 and s[i] != s[i - 1] and s[i] != s[i + 1] :
                    single = True
        if not truth and single:
                    coun -= 1  
        print(coun)
                 