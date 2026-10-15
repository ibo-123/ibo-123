import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/product.dart';
import '../services/api_service.dart';

// This FutureProvider will automatically handle fetching products 
// and providing loading/error/data states to our UI.
final productsProvider = FutureProvider<List<Product>>((ref) async {
  // We read the apiService from the provider we created earlier
  final apiService = ref.watch(apiServiceProvider);
  
  // Return the fetched products
  return apiService.getProducts();
});
