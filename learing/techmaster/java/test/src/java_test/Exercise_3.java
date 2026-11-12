package java_test;

import utils.Input;

public class Exercise_3 {
    // Số nguyên tố: lớn hơn 1 và không chia hết cho số nào từ 2 tới căn bậc hai của nó.
    // (Bản cũ dừng vòng lặp ngay ở lần chia đầu tiên, nên số lẻ nào cũng bị coi là số nguyên tố)
    public static boolean is_prime(int number) {
        if (number < 2) {
            return false;
        }
        for (int i = 2; i <= number / i; i++) {
            if (number % i == 0) {
                return false;
            }
        }
        return true;
    }

    // Kiểm tra số do người dùng nhập (bản làm bài thi để máy bốc ngẫu nhiên một số từ 0 tới 1098)
    public static void check_prime() {
        System.out.print("Nhập số cần kiểm tra: ");
        int number = Input.readInt();
        if (is_prime(number)) {
            System.out.println(number + " là số nguyên tố");
        } else {
            System.out.println(number + " không phải số nguyên tố");
        }
    }
}
