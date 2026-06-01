<?php
/**
 * Plugin Name: I:Bro Headless Store REST API
 * Plugin URI:  https://ibro.ru/
 * Description: Синхронизация каталога, глобальных настроек и сбор заказов для headless-фронтенда I:Bro.
 * Version:     1.0.0
 * Author:      I:Bro Team
 * Author URI:  https://ibro.ru/
 * License:     GPL2
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit; // Exit if accessed directly.
}

// Register REST API Endpoints on 'rest_api_init' hook
add_action( 'rest_api_init', 'ibro_register_rest_routes' );

function ibro_register_rest_routes() {
    // 1. GET Products
    register_rest_route( 'ibro/v1', '/products', array(
        'methods'             => 'GET',
        'callback'            => 'ibro_get_products',
        'permission_callback' => '__return_true', // Public endpoint
    ) );

    // 2. GET & POST Options (Settings)
    register_rest_route( 'ibro/v1', '/options', array(
        array(
            'methods'             => 'GET',
            'callback'            => 'ibro_get_options',
            'permission_callback' => '__return_true', // Public
        ),
        array(
            'methods'             => 'POST',
            'callback'            => 'ibro_update_options',
            'permission_callback' => 'ibro_admin_permission_check', // Securing administration settings
        ),
    ) );

    // 3. POST Orders (Create Order)
    register_rest_route( 'ibro/v1', '/orders', array(
        'methods'             => 'POST',
        'callback'            => 'ibro_create_order',
        'permission_callback' => '__return_true', // Public
    ) );
}

/**
 * 1. Callback for getting products
 */
function ibro_get_products( $request ) {
    $products = get_option( 'ibro_cached_products', array() );
    
    if ( empty( $products ) ) {
        // If empty, return standard cached list of products
        $products = array();
    }

    return new WP_REST_Response( $products, 200 );
}

/**
 * 2. Callback for getting options
 */
function ibro_get_options() {
    $options = get_option( 'ibro_shop_options', array() );

    if ( empty( $options ) ) {
        // Dynamic fallback matching React configurations
        $options = array(
            'phone'         => '+7 (495) 123-4567',
            'email'         => 'info@ibro.ru',
            'address'       => 'г. Москва, ул. Арбат, д. 10',
            'telegramAdmin' => '@ibro_manager',
            'socials'       => array(
                'vk' => 'https://vk.com/ibro_store',
                'telegram' => 'https://t.me/ibro_store',
                'whatsapp' => 'https://wa.me/79251234567'
            ),
            'banners'      => array(
                array(
                    'id' => 1,
                    'title' => 'iPhone 16 Pro Max',
                    'subtitle' => 'Превосходство в каждой грани.',
                    'link' => '/category/iPhone',
                    'image' => 'https://images.unsplash.com/photo-1727371583571-0818276f570d?q=80&w=1200'
                )
            ),
            'seo'           => array(
                'title' => 'Мобильный интернет магазин техники Apple I:Bro',
                'description' => 'Оригинальная техника Apple по низким ценам.',
                'robots' => 'index, follow'
            )
        );
        update_option( 'ibro_shop_options', $options );
    }

    return new WP_REST_Response( $options, 200 );
}

/**
 * Callback for updating options
 */
function ibro_update_options( $request ) {
    $params = $request->get_json_params();
    if ( empty( $params ) ) {
        return new WP_Error( 'missing_data', 'Пустые настройки', array( 'status' => 400 ) );
    }

    update_option( 'ibro_shop_options', $params );
    return new WP_REST_Response( array( 'success' => true, 'message' => 'Настройки обновлены!' ), 200 );
}

/**
 * 3. Callback for creating order
 */
function ibro_create_order( $request ) {
    $params = $request->get_json_params();
    
    if ( empty( $params['fio'] ) || empty( $params['phone'] ) ) {
        return new WP_Error( 'missing_fields', 'Заполните Имя и Телефон.', array( 'status' => 400 ) );
    }

    // Save order in WordPress option list
    $orders = get_option( 'ibro_orders_list', array() );
    
    $new_order_id = ! empty( $orders ) ? max( array_column( $orders, 'id' ) ) + 1 : 1001;
    
    $new_order = array(
        'id'         => $new_order_id,
        'fio'        => sanitize_text_field( $params['fio'] ),
        'phone'      => sanitize_text_field( $params['phone'] ),
        'email'      => sanitize_email( isset( $params['email'] ) ? $params['email'] : '' ),
        'city'       => sanitize_text_field( isset( $params['city'] ) ? $params['city'] : '' ),
        'address'    => sanitize_textarea_field( isset( $params['address'] ) ? $params['address'] : '' ),
        'comment'    => sanitize_textarea_field( isset( $params['comment'] ) ? $params['comment'] : '' ),
        'payment'    => sanitize_text_field( isset( $params['payment'] ) ? $params['payment'] : 'Наличные' ),
        'items'      => isset( $params['items'] ) ? $params['items'] : array(),
        'status'     => 'new',
        'date'       => current_time( 'mysql' ),
        'totalPrice' => 0
    );

    // Calculate total price safely
    foreach ( $new_order['items'] as $item ) {
        $price = isset( $item['price'] ) ? intval( $item['price'] ) : 0;
        $count = isset( $item['count'] ) ? intval( $item['count'] ) : 1;
        $new_order['totalPrice'] += ($price * $count);
    }

    array_unshift( $orders, $new_order );
    update_option( 'ibro_orders_list', $orders );

    // Optional: Send Notification to Administrator Email
    $to = get_option( 'admin_email' );
    $subject = '🔥 Новый заказ #' . $new_order_id . ' – ' . $new_order['fio'];
    
    // Construct HTML Email
    $headers = array('Content-Type: text/html; charset=UTF-8');
    $body = "<h2>Новый заказ #{$new_order_id} в магазине I:Bro</h2>";
    $body .= "<p><strong>Клиент:</strong> {$new_order['fio']}<br>";
    $body .= "<strong>Телефон:</strong> {$new_order['phone']}<br>";
    $body .= "<strong>Доставка:</strong> {$new_order['city']}, {$new_order['address']}<br>";
    $body .= "<strong>Сумма заказа:</strong> " . number_format($new_order['totalPrice'], 0, '', ' ') . " ₽</p>";
    $body .= "<h3>Товары:</h3><ul>";
    
    foreach ( $new_order['items'] as $item ) {
        $body .= "<li>{$item['name']} – {$item['color']} / {$item['storage']}GB x {$item['count']} шт.</li>";
    }
    $body .= "</ul>";

    wp_mail( $to, $subject, $body, $headers );

    return new WP_REST_Response( array(
        'success' => true,
        'orderId' => $new_order_id,
        'message' => 'Заказ успешно создан! Менеджер свяжется с вами в ближайшее время.'
    ), 200 );
}

/**
 * Security Permission Callback for Saving settings
 */
function ibro_admin_permission_check( $request ) {
    return current_user_can( 'manage_options' ) || ibro_verify_custom_api_key( $request );
}

function ibro_verify_custom_api_key( $request ) {
    $token = $request->get_header( 'Authorization' );
    if ( ! $token ) {
        $token = $request->get_param( 'api_token' );
    }
    
    if ( $token ) {
        $token = str_replace( 'Bearer ', '', $token );
        $saved_token = get_option( 'ibro_access_token', 'ibro_secret_default_token_key' );
        return hash_equals( $saved_token, $token );
    }
    
    return false;
}
