import basic_geometries_bmi_calc.BMI_values;
import basic_geometries_bmi_calc.circle;
import basic_geometries_bmi_calc.square;
import basic_geometries_bmi_calc.triangle;
import utils.Input;

public class main {
    public static void main(String[] args) {
        System.out.println("1: Tính chỉ số BMI");
        System.out.println("2: Hình vuông");
        System.out.println("3: Tam giác");
        System.out.println("4: Hình tròn");
        System.out.print("Chọn: ");

        switch (Input.readInt()) {
            case 1: {
                System.out.print("Cân nặng (kg): ");
                double weight = Input.readPositive();
                System.out.print("Chiều cao (m): ");
                double height = Input.readPositive();
                double bmi = BMI_values.BMI_value_double(weight, height);
                System.out.printf("Chỉ số BMI: %.2f%n", bmi);
                System.out.println("Xếp loại: " + BMI_values.classify(bmi));
                break;
            }
            case 2: {
                System.out.print("Độ dài cạnh: ");
                double side = Input.readPositive();
                System.out.printf("Diện tích: %.2f%n", square.area(side));
                System.out.printf("Chu vi: %.2f%n", square.perimeter(side));
                break;
            }
            case 3: {
                System.out.print("Cạnh a: ");
                double a = Input.readPositive();
                System.out.print("Cạnh b: ");
                double b = Input.readPositive();
                System.out.print("Cạnh c: ");
                double c = Input.readPositive();
                if (!triangle.is_valid(a, b, c)) {
                    System.out.println("Ba cạnh này không ghép được thành tam giác");
                    break;
                }
                System.out.printf("Diện tích: %.2f%n", triangle.area(a, b, c));
                System.out.printf("Chu vi: %.2f%n", triangle.perimeter(a, b, c));
                break;
            }
            case 4: {
                System.out.print("Bán kính: ");
                double radius = Input.readPositive();
                System.out.printf("Diện tích: %.2f%n", circle.area(radius));
                System.out.printf("Chu vi: %.2f%n", circle.perimeter(radius));
                break;
            }
            default:
                System.out.println("Không có mục này");
        }
    }
}
