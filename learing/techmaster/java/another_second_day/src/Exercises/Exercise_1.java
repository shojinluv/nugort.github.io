package Exercises;

import utils.Input;

public class Exercise_1 {
    public static double hypotenuse_calc(double a_side, double b_side) {
        return Math.sqrt(a_side * a_side + b_side * b_side);
    }

    public static void side_input() {
        System.out.print("Cạnh góc vuông thứ nhất: ");
        double a_side = Input.readPositive();
        System.out.print("Cạnh góc vuông thứ hai: ");
        double b_side = Input.readPositive();
        System.out.printf("Cạnh huyền: %.2f%n", hypotenuse_calc(a_side, b_side));
    }
}
