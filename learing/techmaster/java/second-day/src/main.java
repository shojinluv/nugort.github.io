import basic_calc.basic_calculations;
import basic_calc.bmi_calc;
import basic_calc.convert_temperature;
import basic_calc.hypotenuse_calc;
import utils.Input;

import java.util.Locale;

public class main {
    public static void main(String[] args) {
        System.out.println("1: Tính chỉ số BMI");
        System.out.println("2: Tính cạnh huyền");
        System.out.println("3: Cộng, trừ, nhân, chia, lũy thừa");
        System.out.println("4: Đổi nhiệt độ (°C ↔ °F)");
        System.out.print("Chọn: ");

        switch (Input.readInt()) {
            case 1: {
                System.out.print("Chiều cao (m): ");
                double height = Input.readPositive();
                System.out.print("Cân nặng (kg): ");
                double weight = Input.readPositive();
                System.out.printf("Chỉ số BMI: %.2f%n", bmi_calc.BMI_value(height, weight));
                break;
            }
            case 2: {
                System.out.print("Cạnh góc vuông thứ nhất: ");
                double side_a = Input.readPositive();
                System.out.print("Cạnh góc vuông thứ hai: ");
                double side_b = Input.readPositive();
                System.out.printf("Cạnh huyền: %.2f%n", hypotenuse_calc.hypotenuse(side_a, side_b));
                break;
            }
            case 3:
                basic_calculations_menu();
                break;
            case 4:
                temperature_menu();
                break;
            default:
                System.out.println("Không có mục này");
        }
    }

    private static void basic_calculations_menu() {
        System.out.println("1: Cộng");
        System.out.println("2: Trừ");
        System.out.println("3: Nhân");
        System.out.println("4: Chia");
        System.out.println("5: Lũy thừa");
        System.out.print("Chọn phép tính: ");

        switch (Input.readInt()) {
            case 1: {
                System.out.print("Số thứ nhất: ");
                double value_1 = Input.readDouble();
                System.out.print("Số thứ hai: ");
                double value_2 = Input.readDouble();
                System.out.println("Kết quả: " + pretty(basic_calculations.addition(value_1, value_2)));
                break;
            }
            case 2: {
                System.out.print("Số bị trừ: ");
                double minuend = Input.readDouble();
                System.out.print("Số trừ: ");
                double subtrahend = Input.readDouble();
                System.out.println("Kết quả: " + pretty(basic_calculations.subtraction(minuend, subtrahend)));
                break;
            }
            case 3: {
                System.out.print("Thừa số thứ nhất: ");
                double multiplicand = Input.readDouble();
                System.out.print("Thừa số thứ hai: ");
                double multiplier = Input.readDouble();
                System.out.println("Kết quả: " + pretty(basic_calculations.multiplication(multiplicand, multiplier)));
                break;
            }
            case 4: {
                System.out.print("Số bị chia: ");
                double dividend = Input.readDouble();
                System.out.print("Số chia: ");
                double divisor = Input.readDouble();
                if (divisor == 0) {
                    System.out.println("Không chia được cho 0");
                } else {
                    System.out.println("Kết quả: " + pretty(basic_calculations.division(dividend, divisor)));
                }
                break;
            }
            case 5: {
                System.out.print("Cơ số: ");
                double base = Input.readDouble();
                System.out.print("Số mũ: ");
                double exponent = Input.readDouble();
                System.out.println("Kết quả: " + pretty(basic_calculations.power(base, exponent)));
                break;
            }
            default:
                System.out.println("Không có phép tính này");
        }
    }

    private static void temperature_menu() {
        System.out.println("1: Độ C sang độ F");
        System.out.println("2: Độ F sang độ C");
        System.out.print("Chọn: ");

        switch (Input.readInt()) {
            case 1: {
                System.out.print("Nhiệt độ (°C): ");
                double celsius = Input.readDouble();
                System.out.printf("Bằng %.2f °F%n", convert_temperature.c_to_f(celsius));
                break;
            }
            case 2: {
                System.out.print("Nhiệt độ (°F): ");
                double fahrenheit = Input.readDouble();
                System.out.printf("Bằng %.2f °C%n", convert_temperature.f_to_c(fahrenheit));
                break;
            }
            default:
                System.out.println("Không có mục này");
        }
    }

    // In số cho gọn: 3 thay vì 3.0, 0.3 thay vì 0.30000000000000004 (giữ tối đa 4 chữ số lẻ)
    private static String pretty(double value) {
        if (value == Math.rint(value) && Math.abs(value) < 1e15) {
            return String.valueOf((long) value);
        }
        return String.format(Locale.US, "%.4f", value).replaceAll("\\.?0+$", "");
    }
}
