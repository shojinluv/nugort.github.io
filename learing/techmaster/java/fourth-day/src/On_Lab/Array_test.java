package On_Lab;

import utils.Input;

public class Array_test {
    // Nhập một mảng rồi tìm số nhỏ nhất và lớn nhất trong cùng một vòng lặp
    // (bản làm trên lớp dùng cứng mảng 3 1 0 7)
    public static void Min_Max() {
        System.out.print("Mảng có bao nhiêu phần tử (1-100)? ");
        int n = Input.readIntBetween(1, 100);
        int[] numbers = new int[n];
        for (int i = 0; i < n; i++) {
            System.out.print("Phần tử thứ " + (i + 1) + ": ");
            numbers[i] = Input.readInt();
        }

        int min = numbers[0];
        int max = numbers[0];
        for (int value : numbers) {
            if (value < min) {
                min = value;
            }
            if (value > max) {
                max = value;
            }
        }
        System.out.println("Nhỏ nhất: " + min);
        System.out.println("Lớn nhất: " + max);
    }
}
