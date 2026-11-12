package Exercises;

import utils.Input;

public class Exercise_2 {
    public static void string_compare() {
        System.out.print("Chuỗi thứ nhất: ");
        String first_string = Input.readLine();
        System.out.print("Chuỗi thứ hai: ");
        String second_string = Input.readLine();

        // So sánh nội dung
        System.out.println(first_string.equals(second_string) ? "Hai chuỗi giống hệt nhau" : "Hai chuỗi khác nhau");

        // So sánh độ dài, có cả trường hợp dài bằng nhau
        if (first_string.length() > second_string.length()) {
            System.out.println("Chuỗi thứ nhất dài hơn");
        } else if (first_string.length() < second_string.length()) {
            System.out.println("Chuỗi thứ nhất ngắn hơn");
        } else {
            System.out.println("Hai chuỗi dài bằng nhau");
        }

        // Chuỗi đầu có chứa chuỗi sau không
        System.out.println(first_string.contains(second_string)
                ? "Chuỗi thứ nhất có chứa chuỗi thứ hai"
                : "Chuỗi thứ nhất không chứa chuỗi thứ hai");
    }
}
