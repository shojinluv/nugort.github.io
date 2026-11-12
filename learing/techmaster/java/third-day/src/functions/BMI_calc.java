package functions;

import utils.Input;

public class BMI_calc {
    public static double calc(double weight, double height) {
        return weight / (height * height);
    }

    // Xếp loại theo bảng BMI của WHO. Các mốc nối liền nhau, không còn khe hở kiểu 24.9 → 25
    public static String classify(double bmi) {
        if (bmi < 18.5) {
            return "Gầy";
        } else if (bmi < 25) {
            return "Bình thường";
        } else if (bmi < 30) {
            return "Thừa cân";
        } else if (bmi < 35) {
            return "Béo phì";
        }
        return "Béo phì nặng";
    }

    public static void input() {
        System.out.print("Cân nặng (kg): ");
        double weight = Input.readPositive();
        System.out.print("Chiều cao (m): ");
        double height = Input.readPositive();
        double bmi = calc(weight, height); // tính một lần rồi dùng lại
        System.out.printf("Chỉ số BMI: %.2f%n", bmi);
        System.out.println("Xếp loại: " + classify(bmi));
    }
}
