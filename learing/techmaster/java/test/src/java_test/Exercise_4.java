package java_test;

import utils.Input;

public class Exercise_4 {
    // Liệt kê n số nguyên tố đầu tiên, n do người dùng chọn
    // (bản làm bài thi cứng n = 10, lại đếm từ 2 nên chỉ in ra 9 số)
    public static void list_prime_number() {
        System.out.print("Muốn liệt kê bao nhiêu số nguyên tố (1-1000)? ");
        int n = Input.readIntBetween(1, 1000);
        int count = 0;
        System.out.print(n + " số nguyên tố đầu tiên: ");
        for (int number = 2; count < n; number++) {
            if (Exercise_3.is_prime(number)) {
                System.out.print(number + " ");
                count++;
            }
        }
        System.out.println();
    }
}
