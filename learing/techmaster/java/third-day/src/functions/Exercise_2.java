package functions;

import utils.Input;

public class Exercise_2 {
    public static void palindrome_check() {
        System.out.print("Nhập chuỗi cần kiểm tra: ");
        String input_string = Input.readNonEmpty();

        // Bỏ khoảng trắng và không phân biệt hoa thường, để "Kayak" hay "nurses run" cũng tính là đối xứng.
        // Lật chuỗi bằng StringBuilder thay vì cộng chuỗi từng ký tự trong vòng lặp
        String cleaned = input_string.replace(" ", "").toLowerCase();
        String reversed = new StringBuilder(cleaned).reverse().toString();
        if (cleaned.equals(reversed)) {
            System.out.printf("\"%s\" là chuỗi đối xứng%n", input_string);
        } else {
            System.out.printf("\"%s\" không phải chuỗi đối xứng%n", input_string);
        }
    }
}
