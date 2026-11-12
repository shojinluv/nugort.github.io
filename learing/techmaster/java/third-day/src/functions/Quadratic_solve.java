package functions;

import utils.Input;

public class Quadratic_solve {
    public static void solve() {
        System.out.println("Giải phương trình ax² + bx + c = 0");
        System.out.print("a = ");
        double a = Input.readDouble();
        System.out.print("b = ");
        double b = Input.readDouble();
        System.out.print("c = ");
        double c = Input.readDouble();

        if (a == 0) {
            // Không còn x² nữa: chỉ là phương trình bậc nhất bx + c = 0
            if (b == 0) {
                System.out.println(c == 0 ? "Phương trình có vô số nghiệm" : "Phương trình vô nghiệm");
            } else {
                System.out.printf("Đây là phương trình bậc nhất, nghiệm x = %.2f%n", -c / b + 0.0); // + 0.0 để không in ra -0.00
            }
            return;
        }

        double delta = b * b - 4 * a * c;
        if (delta < 0) {
            System.out.println("Delta < 0: phương trình vô nghiệm");
        } else if (delta == 0) {
            System.out.printf("Delta = 0: nghiệm kép x1 = x2 = %.2f%n", -b / (2 * a) + 0.0);
        } else {
            double sqrt_delta = Math.sqrt(delta);
            double x1 = (-b + sqrt_delta) / (2 * a) + 0.0;
            double x2 = (-b - sqrt_delta) / (2 * a) + 0.0;
            System.out.printf("Delta > 0: hai nghiệm x1 = %.2f, x2 = %.2f%n", x1, x2);
        }
    }
}
