import functions.BMI_calc;
import functions.Exercise_1;
import functions.Exercise_2;
import functions.F__king_sh_t_login;
import functions.Fizzbuzz;
import functions.Quadratic_solve;
import utils.Input;

public class main {
    // Menu gom hết bài của buổi 3, để bài nào cũng chạy được (trước đây main chỉ gọi hai bài đầu)
    public static void main(String[] args) {
        for (;;) {
            System.out.println();
            System.out.println("1: Đếm một chữ trong câu");
            System.out.println("2: Kiểm tra chuỗi đối xứng");
            System.out.println("3: Tính chỉ số BMI");
            System.out.println("4: FizzBuzz");
            System.out.println("5: Giải phương trình bậc 2");
            System.out.println("6: Đăng nhập");
            System.out.println("0: Thoát");
            System.out.print("Chọn: ");
            switch (Input.readInt()) {
                case 1:
                    Exercise_1.count_character();
                    break;
                case 2:
                    Exercise_2.palindrome_check();
                    break;
                case 3:
                    BMI_calc.input();
                    break;
                case 4:
                    Fizzbuzz.fizzbuzz();
                    break;
                case 5:
                    Quadratic_solve.solve();
                    break;
                case 6:
                    F__king_sh_t_login.check_info();
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
