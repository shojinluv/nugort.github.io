package Home_Work;

import utils.Input;

public class Exercise_1 {
    // Làm lại bằng vòng lặp do/while, thay cho kiểu gọi lại chính hàm này (đệ quy) như trước
    public static void display_name() {
        int select;
        do {
            System.out.print("Nhập họ tên: ");
            String name = normalize_name(Input.readLine());
            while (name.isEmpty()) {
                System.out.print("Tên không được để trống, nhập lại: ");
                name = normalize_name(Input.readLine());
            }
            System.out.println("Tên đã chuẩn hoá: " + name);
            do {
                System.out.print("Nhập tên khác? (1: có, 2: không): ");
                select = Input.readInt();
            } while (select < 1 || select > 2);
        } while (select == 1);
    }

    // Chuẩn hoá tên: bỏ khoảng trắng thừa, viết hoa chữ cái đầu mỗi từ, các chữ còn lại viết thường
    // ("  nGUYỄN   văn  an " → "Nguyễn Văn An")
    public static String normalize_name(String name) {
        StringBuilder result = new StringBuilder();
        for (String word : name.trim().toLowerCase().split("\\s+")) {
            if (word.isEmpty()) {
                continue;
            }
            if (result.length() > 0) {
                result.append(' ');
            }
            result.append(Character.toUpperCase(word.charAt(0))).append(word.substring(1));
        }
        return result.toString();
    }
}
