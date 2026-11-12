package basic_calc;

public class basic_calculations {
    public static double addition(double value_1, double value_2) {
        return value_1 + value_2;
    }

    public static double subtraction(double minuend, double subtrahend) {
        return minuend - subtrahend;
    }

    public static double multiplication(double multiplicand, double multiplier) {
        return multiplicand * multiplier;
    }

    // Nơi gọi hàm này phải tự kiểm tra số chia khác 0 trước (xem main.java)
    public static double division(double dividend, double divisor) {
        return dividend / divisor;
    }

    public static double power(double base, double exponent) {
        return Math.pow(base, exponent);
    }
}
