#include <stdio.h>
int main(){
int x = 10;
int *p;
p = x;      // p now holds the address of x
printf("%d", *p);  // prints 10
}
