package Exercises;

import utils.Input;

public class Exercise_3 {
    // Đoán số: máy nghĩ một số từ 0 tới 1098, đoán sai thì được gợi ý lớn hơn hay nhỏ hơn
    public static void f__king_random_number() {
        int random_number = (int) (Math.random() * 1099);
        int tries = 0;
        System.out.println("Mình đang nghĩ một số từ 0 tới 1098, đoán thử xem!");
        while (true) {
            System.out.print("Bạn đoán: ");
            int guess = Input.readInt();
            tries++;
            if (guess < random_number) {
                System.out.println("Số cần tìm lớn hơn ⬆");
            } else if (guess > random_number) {
                System.out.println("Số cần tìm nhỏ hơn ⬇");
            } else {
                System.out.println("Đúng rồi! Là số " + random_number + ", bạn đoán " + tries + " lần 🎉");
                return;
            }
        }
    }
}
