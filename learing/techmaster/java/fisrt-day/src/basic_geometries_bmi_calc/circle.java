package basic_geometries_bmi_calc;

public class circle {
    public static double perimeter(double radius) {
        return 2 * Math.PI * radius;
    }

    public static double area(double radius) {
        return Math.PI * radius * radius;
    }
}
