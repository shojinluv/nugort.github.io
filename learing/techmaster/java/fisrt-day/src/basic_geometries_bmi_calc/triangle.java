package basic_geometries_bmi_calc;

public class triangle {
    // Ba cạnh chỉ ghép được thành tam giác khi tổng hai cạnh bất kỳ lớn hơn cạnh còn lại
    public static boolean is_valid(double a, double b, double c) {
        return a + b > c && a + c > b && b + c > a;
    }

    public static double perimeter(double a, double b, double c) {
        return a + b + c;
    }

    // Công thức Heron, p là nửa chu vi
    public static double area(double a, double b, double c) {
        double p = (a + b + c) / 2;
        return Math.sqrt(p * (p - a) * (p - b) * (p - c));
    }
}
