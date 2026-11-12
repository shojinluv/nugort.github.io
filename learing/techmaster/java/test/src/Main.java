import java_test.*;
import utils.Input;

public class Main {
    // Menu chọn câu, thay cho việc comment/bỏ comment từng dòng mỗi lần muốn chạy câu khác
    public static void main(String[] args) {
        for (;;) {
            System.out.println();
            System.out.println("1: Tam giác sao");
            System.out.println("2: Đếm từ và tìm một chữ trong câu");
            System.out.println("3: Kiểm tra số nguyên tố");
            System.out.println("4: Liệt kê các số nguyên tố đầu tiên");
            System.out.println("5: Đường chéo chính của ma trận");
            System.out.println("0: Thoát");
            System.out.print("Chọn: ");
            switch (Input.readInt()) {
                case 1:
                    Exercise_1.triangle();
                    break;
                case 2:
                    Exercise_2.count_words();
                    break;
                case 3:
                    Exercise_3.check_prime();
                    break;
                case 4:
                    Exercise_4.list_prime_number();
                    break;
                case 5:
                    Exercise_5.two_d_array();
                    break;
                case 0:
                    System.out.println("Tạm biệt!");
                    return;
                default:
                    System.out.println("Không có mục này");
            }
        }
    }
}
