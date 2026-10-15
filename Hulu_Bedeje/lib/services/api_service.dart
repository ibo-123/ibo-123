import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/product.dart';

final apiServiceProvider = Provider<ApiService>((ref) {
  return ApiService(Dio());
});

class ApiService {
  final Dio _dio;
  static const String baseUrl = 'https://fakestoreapi.com';

  ApiService(this._dio) {
    _dio.options.baseUrl = baseUrl;
  }

  Future<List<Product>> getProducts() async {
    try {
      final response = await _dio.get('/products');
      if (response.statusCode == 200) {
        List<dynamic> data = response.data;
        return data.map((json) => Product.fromJson(json)).toList();
      } else {
        throw Exception('Failed to load products with status code: ${response.statusCode}');
      }
    } catch (e) {
      throw Exception('Error fetching products: $e');
    }
  }
}