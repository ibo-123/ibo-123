#include<iostream>
using namespace std;

int solve(int a, int b , int c) {
    int round = 0;
    int min , max , mid;
    if (a == b || b == c || a == c) {
        return 0;
    }
    if (a < b && a < c) {
        min = a;
    } else if (b < a && b < c) {
        min = b;
    } else {
        min = c;
    }
    if (a > b && a > c) {
        max = a;
    } else if (b > a && b > c) {
        max = b;
    } else {
        max = c;
    }
    if ((a != min && a != max) || (b != min && b != max) || (c != min && c != max)) {
        mid = a + b + c - min - max;
    } else {
        mid = 0;
    }
    if (max - mid == mid - min) {
        round = max - mid;
    } else if (max - mid > mid - min) {
        round =(mid - min);
    } else {
        round = (max - mid);
    }
    return round;
}
int main() {
    int x ;
        cin >> x;
        while(x--) {
            int a , b , c;
            cin >> a >> b >> c;
            cout << solve(a, b, c) << endl;
        }
}