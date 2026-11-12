package functions;

import utils.Input;

public class Fizzbuzz {
    // Đếm từ 1 tới số người dùng chọn (bản đầu đếm cứng từ 0 tới 100)
    public static void fizzbuzz() {
        System.out.print("Đếm từ 1 tới số mấy (1-1000)? ");
        int n = Input.readIntBetween(1, 1000);
        for (int i = 1; i <= n; i++) {
            if (i % 15 == 0) {
                System.out.println("FIZZBUZZ");
            } else if (i % 3 == 0) {
                System.out.println("FIZZ");
            } else if (i % 5 == 0) {
                System.out.println("BUZZ");
            } else {
                System.out.println(i);
            }
        }
    }
}
