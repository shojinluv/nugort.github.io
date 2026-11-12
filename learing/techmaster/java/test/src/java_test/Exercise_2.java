package java_test;

import utils.Input;

public class Exercise_2 {
    public static final char SPACE = ' ';
    public static final char TAB = '\t';
    public static final char BREAK_LINE = '\n';

    // Đếm số từ trong câu, rồi tìm một chữ: xuất hiện mấy lần, ở những vị trí nào (không phân biệt hoa thường)
    // (bản làm bài thi dùng cứng câu "You only live once..." và chữ o)
    public static void count_words() {
        System.out.print("Nhập một câu: ");
        String sentence = Input.readNonEmpty();

        // Một từ bắt đầu ở ký tự không phải khoảng trắng đứng ngay sau khoảng trắng (hoặc ở đầu câu)
        int count = 0;
        boolean not_counted = true;
        for (int i = 0; i < sentence.length(); i++) {
            char c = sentence.charAt(i);
            if (c != SPACE && c != TAB && c != BREAK_LINE) {
                if (not_counted) {
                    count++;
                    not_counted = false;
                }
            } else {
                not_counted = true;
            }
        }
        System.out.println("Số từ: " + count);

        System.out.print("Chữ cần tìm: ");
        char character = Input.readChar();
        char target = Character.toLowerCase(character);
        int found = 0;
        StringBuilder positions = new StringBuilder();
        for (int i = 0; i < sentence.length(); i++) {
            if (Character.toLowerCase(sentence.charAt(i)) == target) {
                found++;
                positions.append(i + 1).append(' '); // vị trí đếm từ 1 cho dễ đọc
            }
        }
        if (found == 0) {
            System.out.println("Chữ \"" + character + "\" không xuất hiện lần nào");
        } else {
            System.out.println("Chữ \"" + character + "\" xuất hiện " + found + " lần, ở vị trí thứ: " + positions.toString().trim());
        }
    }
}
