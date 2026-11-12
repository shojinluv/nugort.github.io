package Exercises;

import utils.Input;

// Gánh xiếc 4.0: ba trò nhỏ trong một menu, lặp tới khi chọn thoát
public class Four_dot_0_circus_menu {
    public static void chmua_hme_menu() {
        for (;;) {
            System.out.println();
            System.out.println("1: Tính cạnh huyền");
            System.out.println("2: So sánh hai chuỗi");
            System.out.println("3: Đoán số");
            System.out.println("4: Thoát");
            int select;
            do {
                System.out.print("Chọn (1-4): ");
                select = Input.readInt();
            } while (select < 1 || select > 4);
            switch (select) {
                case 1:
                    Exercise_1.side_input();
                    break;
                case 2:
                    Exercise_2.string_compare();
                    break;
                case 3:
                    Exercise_3.f__king_random_number();
                    break;
                default:
                    System.out.println("Tạm biệt!");
                    return;
            }
        }
    }
}
