package Home_Work;

import utils.Input;

public class Exercise_2 {
    // Làm lại bằng vòng lặp do/while, thay cho kiểu gọi lại chính hàm này (đệ quy) như trước
    public static void another_array() {
        int select;
        do {
            int n;
            do {
                System.out.print("Mảng có bao nhiêu phần tử (1-100)? ");
                n = Input.readInt();
            } while (n < 1 || n > 100);

            int[] array = new int[n];
            for (int i = 0; i < n; i++) {
                System.out.print("Phần tử thứ " + (i + 1) + ": ");
                array[i] = Input.readInt();
            }
            System.out.print("Mảng ban đầu: ");
            print_array(array);

            //Chỗ này là "tăng lên 1 đơn vị vào số chẵn" chứ không phải "tăng lên 1 phần từ vào số chẵn" như chị giáo nói đâu nhó 😆
            for (int i = 0; i < n; i++) {
                if (array[i] % 2 == 0) {
                    array[i]++;
                }
            }
            System.out.print("Sau khi cộng 1 vào các số chẵn: ");
            print_array(array);

            do {
                System.out.print("Làm lại? (1: có, 2: không): ");
                select = Input.readInt();
            } while (select < 1 || select > 2);
        } while (select == 1);
    }

    private static void print_array(int[] array) {
        for (int value : array) {
            System.out.print(value + " ");
        }
        System.out.println();
    }
}
