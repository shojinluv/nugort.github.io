package Home_Work;

import utils.Input;

public class Chmua_Hme_Menu {
    public static void menu() {
        for (;;) {
            System.out.println();
            System.out.println("1: Chuẩn hoá tên");
            System.out.println("2: Cộng 1 vào các số chẵn trong mảng");
            System.out.println("3: Thoát");
            int select;
            do {
                System.out.print("Chọn (1-3): ");
                select = Input.readInt();
            } while (select < 1 || select > 3);
            switch (select) {
                case 1:
                    Exercise_1.display_name();
                    break;
                case 2:
                    Exercise_2.another_array();
                    break;
                default:
                    System.out.println("Tạm biệt!");
                    return;
            }
        }
    }
}
