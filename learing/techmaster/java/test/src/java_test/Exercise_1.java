package java_test;

import utils.Input;

public class Exercise_1 {
    public static void triangle() {
        System.out.print("Chiều cao tam giác: ");
        int height = Input.readInt();
        while (height < 1) {
            System.out.print("Chiều cao phải từ 1 trở lên, nhập lại: ");
            height = Input.readInt();
        }
        for (int i = 1; i <= height; i++) {
            for (int j = 1; j <= i; j++) {
                System.out.print("* ");
            }
            System.out.println();
        }
    }
}
