#!/usr/bin/env node
/**
 * Product Validation Script
 * 
 * This script validates that all 226 products are properly loaded from Google Sheets
 * and have the required fields.
 * 
 * Usage:
 *   node scripts/check-products.js
 * 
 * Requirements:
 *   - GOOGLE_SHEET_URL environment variable must be set
 *   - Node.js with ES modules support
 */

import { fetchProductRows } from '../lib/products.js';

const EXPECTED_PRODUCT_COUNT = 226;
const REQUIRED_FIELDS = ['name', 'tokCode', 'oemCode', 'model'];

async function checkProducts() {
    console.log('🔍 Checking product details from Google Sheets...\n');

    try {
        // Fetch products
        console.log('📥 Fetching products from Google Sheets...');
        const products = await fetchProductRows({ force: true });
        
        console.log(`✅ Successfully fetched ${products.length} products\n`);

        // Check product count
        console.log('📊 Product Count Validation:');
        console.log(`   Expected: ${EXPECTED_PRODUCT_COUNT} products`);
        console.log(`   Actual: ${products.length} products`);
        
        if (products.length === EXPECTED_PRODUCT_COUNT) {
            console.log('   ✅ Product count matches!\n');
        } else if (products.length > EXPECTED_PRODUCT_COUNT) {
            console.log(`   ⚠️  Warning: ${products.length - EXPECTED_PRODUCT_COUNT} more products than expected\n`);
        } else {
            console.log(`   ❌ Error: Missing ${EXPECTED_PRODUCT_COUNT - products.length} products\n`);
        }

        // Validate product fields
        console.log('🔎 Validating product fields...');
        const incompleteProducts = [];
        const missingFields = {};

        products.forEach((product, index) => {
            const missing = [];
            
            REQUIRED_FIELDS.forEach(field => {
                const value = product[field];
                if (!value || String(value).trim() === '') {
                    missing.push(field);
                }
            });

            if (missing.length > 0) {
                incompleteProducts.push({
                    index: index + 1,
                    id: product.id || product.tokCode || product.oemCode || `Product #${index + 1}`,
                    missingFields: missing
                });

                missing.forEach(field => {
                    missingFields[field] = (missingFields[field] || 0) + 1;
                });
            }
        });

        if (incompleteProducts.length === 0) {
            console.log('   ✅ All products have required fields\n');
        } else {
            console.log(`   ⚠️  Found ${incompleteProducts.length} products with missing fields:\n`);
            
            // Show summary of missing fields
            console.log('   Missing Field Summary:');
            Object.entries(missingFields).forEach(([field, count]) => {
                console.log(`     - ${field}: ${count} product(s)`);
            });
            console.log('');

            // Show first 10 incomplete products
            const displayCount = Math.min(10, incompleteProducts.length);
            console.log(`   First ${displayCount} incomplete products:`);
            incompleteProducts.slice(0, displayCount).forEach(p => {
                console.log(`     ${p.index}. ${p.id} - Missing: ${p.missingFields.join(', ')}`);
            });
            
            if (incompleteProducts.length > 10) {
                console.log(`     ... and ${incompleteProducts.length - 10} more\n`);
            } else {
                console.log('');
            }
        }

        // Sample products
        console.log('📦 Sample Products (first 5):');
        products.slice(0, 5).forEach((product, index) => {
            console.log(`\n${index + 1}. Name: ${product.name?.substring(0, 60) || 'N/A'}${product.name?.length > 60 ? '...' : ''}`);
            console.log(`   TOK Code: ${product.tokCode || 'N/A'}`);
            console.log(`   OEM Code: ${product.oemCode || 'N/A'}`);
            console.log(`   Model: ${product.model || 'N/A'}`);
            console.log(`   Price (with VAT): ${product.priceWithVat || 'N/A'}`);
            console.log(`   Stock: ${product.stock || 'N/A'}`);
        });

        // Summary
        console.log('\n' + '='.repeat(60));
        console.log('📋 SUMMARY:');
        console.log('='.repeat(60));
        console.log(`Total products: ${products.length}`);
        console.log(`Expected: ${EXPECTED_PRODUCT_COUNT}`);
        console.log(`Complete products: ${products.length - incompleteProducts.length}`);
        console.log(`Incomplete products: ${incompleteProducts.length}`);
        
        if (products.length === EXPECTED_PRODUCT_COUNT && incompleteProducts.length === 0) {
            console.log('\n✅ SUCCESS: All 226 products are present and complete!');
            return 0;
        } else if (products.length === EXPECTED_PRODUCT_COUNT) {
            console.log('\n⚠️  WARNING: Product count is correct but some products have missing fields');
            return 1;
        } else {
            console.log('\n❌ ERROR: Product count does not match expected value');
            return 1;
        }

    } catch (error) {
        console.error('❌ Error checking products:', error.message);
        console.error('\nMake sure:');
        console.error('  1. GOOGLE_SHEET_URL is set in your .env file');
        console.error('  2. The Google Sheet is published and accessible');
        console.error('  3. You have internet connectivity\n');
        return 1;
    }
}

// Run the check
checkProducts().then(exitCode => {
    process.exit(exitCode);
}).catch(error => {
    console.error('Unexpected error:', error);
    process.exit(1);
});
