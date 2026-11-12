package functions;

import utils.Input;

public class Exercise_1 {
    // Đếm xem một chữ xuất hiện mấy lần trong câu, không phân biệt hoa thường
    // (bản đầu chỉ đếm cứng chữ e trong câu "Hello everyone")
    public static void count_character() {
        System.out.print("Nhập một câu: ");
        String sentence = Input.readNonEmpty();
        System.out.print("Chữ cần đếm: ");
        char character = Input.readChar();

        char target = Character.toLowerCase(character);
        int count = 0;
        for (int i = 0; i < sentence.length(); i++) {
            if (Character.toLowerCase(sentence.charAt(i)) == target) {
                count++;
            }
        }
        System.out.println("Chữ \"" + character + "\" xuất hiện " + count + " lần");
    }
}
