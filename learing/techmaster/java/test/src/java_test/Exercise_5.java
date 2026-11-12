package java_test;

import utils.Input;

public class Exercise_5 {
    public static void two_d_array() {
        // Kích thước từ 1 tới 10: số âm thì Java báo lỗi NegativeArraySizeException, còn to quá thì nhập tay mỏi tay
        System.out.print("Số hàng (1-10): ");
        int row = Input.readIntBetween(1, 10);
        System.out.print("Số cột (1-10): ");
        int column = Input.readIntBetween(1, 10);

        int[][] array = new int[row][column];
        for (int i = 0; i < row; i++) {
            for (int j = 0; j < column; j++) {
                System.out.print("Phần tử [" + i + "][" + j + "]: ");
                array[i][j] = Input.readInt();
            }
        }

        System.out.println("Ma trận vừa nhập:");
        for (int[] line : array) {
            for (int value : line) {
                System.out.print(value + " ");
            }
            System.out.println();
        }

        // Đường chéo chính là các ô [i][i], chỉ cần một vòng lặp thay vì hai vòng lồng nhau
        System.out.print("Đường chéo chính: ");
        for (int i = 0; i < Math.min(row, column); i++) {
            System.out.print(array[i][i] + " ");
        }
        System.out.println();
    }
}
