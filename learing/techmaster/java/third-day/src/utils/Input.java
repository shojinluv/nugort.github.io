package utils;

import java.util.Scanner;

// Đọc dữ liệu từ bàn phím, dùng chung một Scanner cho cả chương trình.
// Mỗi lần đọc nguyên một dòng; gõ sai (chữ thay vì số...) thì nhắc gõ lại chứ không văng lỗi.
public class Input {
    private static final Scanner SCANNER = new Scanner(System.in);

    public static String readLine() {
        return SCANNER.nextLine();
    }

    // Đọc một dòng, để trống (hoặc toàn khoảng trắng) thì nhắc gõ lại
    public static String readNonEmpty() {
        while (true) {
            String line = readLine();
            if (!line.trim().isEmpty()) {
                return line;
            }
            System.out.print("Bạn chưa nhập gì, nhập lại: ");
        }
    }

    // Đọc đúng một ký tự
    public static char readChar() {
        while (true) {
            String line = readLine();
            if (line.length() == 1) {
                return line.charAt(0);
            }
            System.out.print("Hãy nhập đúng một ký tự: ");
        }
    }

    public static int readInt() {
        while (true) {
            String line = readLine().trim();
            try {
                return Integer.parseInt(line);
            } catch (NumberFormatException e) {
                System.out.print("Hãy nhập một số nguyên: ");
            }
        }
    }

    // Đọc một số nguyên trong khoảng từ min tới max
    public static int readIntBetween(int min, int max) {
        while (true) {
            int value = readInt();
            if (value >= min && value <= max) {
                return value;
            }
            System.out.print("Hãy nhập số từ " + min + " tới " + max + ": ");
        }
    }

    public static double readDouble() {
        while (true) {
            String line = readLine().trim().replace(',', '.'); // gõ 1,5 hay 1.5 đều được
            try {
                double value = Double.parseDouble(line);
                if (Double.isFinite(value)) {
                    return value;
                }
            } catch (NumberFormatException e) {
                // gõ sai thì nhắc gõ lại ở dưới
            }
            System.out.print("Hãy nhập một số: ");
        }
    }

    public static double readPositive() {
        while (true) {
            double value = readDouble();
            if (value > 0) {
                return value;
            }
            System.out.print("Hãy nhập một số lớn hơn 0: ");
        }
    }
}
