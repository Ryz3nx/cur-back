#!/bin/bash

# CNC Optimization Service Performance Testing Script
# This script tests the service performance and validates response time requirements

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SERVICE_URL="http://localhost:8080"
TARGET_RESPONSE_TIME=3000  # 3 seconds in milliseconds
TEST_ITERATIONS=10

print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Check if service is running
check_service() {
    print_info "Checking if service is running..."
    
    if ! curl -f "$SERVICE_URL/health" > /dev/null 2>&1; then
        print_error "Service is not running at $SERVICE_URL"
        print_info "Please start the service first: docker-compose up -d"
        exit 1
    fi
    
    print_status "Service is running"
}

# Test small optimization job (20-50 pieces)
test_small_job() {
    print_info "Testing small optimization job (20 pieces)..."
    
    local total_time=0
    local success_count=0
    
    for i in $(seq 1 $TEST_ITERATIONS); do
        local start_time=$(date +%s%3N)
        
        local response=$(curl -s -X POST "$SERVICE_URL/optimize" \
            -H "Content-Type: application/json" \
            -d '{
                "pieces": [
                    {"id": "rect1", "length": 100, "width": 50, "quantity": 5, "canRotate": true, "priority": 1},
                    {"id": "rect2", "length": 75, "width": 60, "quantity": 4, "canRotate": false, "priority": 2},
                    {"id": "rect3", "length": 120, "width": 40, "quantity": 3, "canRotate": true, "priority": 3},
                    {"id": "rect4", "length": 80, "width": 80, "quantity": 4, "canRotate": true, "priority": 1},
                    {"id": "rect5", "length": 150, "width": 30, "quantity": 4, "canRotate": false, "priority": 2}
                ],
                "panel": {"length": 800, "width": 600},
                "settings": {
                    "kerf": 3.2,
                    "padding": {"left": 10, "right": 10, "top": 10, "bottom": 10},
                    "cutPreference": "hybrid"
                }
            }')
        
        local end_time=$(date +%s%3N)
        local duration=$((end_time - start_time))
        
        if echo "$response" | grep -q '"success":true'; then
            success_count=$((success_count + 1))
            total_time=$((total_time + duration))
            
            local efficiency=$(echo "$response" | grep -o '"efficiency":[0-9.]*' | cut -d: -f2)
            print_info "Test $i: ${duration}ms, Efficiency: ${efficiency}"
        else
            print_warning "Test $i failed: ${duration}ms"
        fi
        
        # Small delay between tests
        sleep 0.5
    done
    
    if [ $success_count -gt 0 ]; then
        local avg_time=$((total_time / success_count))
        print_info "Small job results: $success_count/$TEST_ITERATIONS successful, Avg: ${avg_time}ms"
        
        if [ $avg_time -le $TARGET_RESPONSE_TIME ]; then
            print_status "Small job performance: PASSED (${avg_time}ms <= ${TARGET_RESPONSE_TIME}ms)"
        else
            print_warning "Small job performance: SLOW (${avg_time}ms > ${TARGET_RESPONSE_TIME}ms)"
        fi
    else
        print_error "All small job tests failed"
    fi
}

# Test medium optimization job (50-100 pieces)
test_medium_job() {
    print_info "Testing medium optimization job (80 pieces)..."
    
    local total_time=0
    local success_count=0
    
    for i in $(seq 1 $TEST_ITERATIONS); do
        local start_time=$(date +%s%3N)
        
        local response=$(curl -s -X POST "$SERVICE_URL/optimize" \
            -H "Content-Type: application/json" \
            -d '{
                "pieces": [
                    {"id": "rect1", "length": 100, "width": 50, "quantity": 10, "canRotate": true, "priority": 1},
                    {"id": "rect2", "length": 75, "width": 60, "quantity": 8, "canRotate": false, "priority": 2},
                    {"id": "rect3", "length": 120, "width": 40, "quantity": 6, "canRotate": true, "priority": 3},
                    {"id": "rect4", "length": 80, "width": 80, "quantity": 8, "canRotate": true, "priority": 1},
                    {"id": "rect5", "length": 150, "width": 30, "quantity": 8, "canRotate": false, "priority": 2},
                    {"id": "rect6", "length": 90, "width": 70, "quantity": 6, "canRotate": true, "priority": 1},
                    {"id": "rect7", "length": 110, "width": 45, "quantity": 7, "canRotate": true, "priority": 2},
                    {"id": "rect8", "length": 70, "width": 90, "quantity": 5, "canRotate": false, "priority": 3},
                    {"id": "rect9", "length": 130, "width": 35, "quantity": 6, "canRotate": true, "priority": 1},
                    {"id": "rect10", "length": 85, "width": 65, "quantity": 8, "canRotate": true, "priority": 2}
                ],
                "panel": {"length": 1200, "width": 800},
                "settings": {
                    "kerf": 3.2,
                    "padding": {"left": 15, "right": 15, "top": 15, "bottom": 15},
                    "cutPreference": "hybrid"
                }
            }')
        
        local end_time=$(date +%s%3N)
        local duration=$((end_time - start_time))
        
        if echo "$response" | grep -q '"success":true'; then
            success_count=$((success_count + 1))
            total_time=$((total_time + duration))
            
            local efficiency=$(echo "$response" | grep -o '"efficiency":[0-9.]*' | cut -d: -f2)
            print_info "Test $i: ${duration}ms, Efficiency: ${efficiency}"
        else
            print_warning "Test $i failed: ${duration}ms"
        fi
        
        # Small delay between tests
        sleep 0.5
    done
    
    if [ $success_count -gt 0 ]; then
        local avg_time=$((total_time / success_count))
        print_info "Medium job results: $success_count/$TEST_ITERATIONS successful, Avg: ${avg_time}ms"
        
        if [ $avg_time -le $TARGET_RESPONSE_TIME ]; then
            print_status "Medium job performance: PASSED (${avg_time}ms <= ${TARGET_RESPONSE_TIME}ms)"
        else
            print_warning "Medium job performance: SLOW (${avg_time}ms > ${TARGET_RESPONSE_TIME}ms)"
        fi
    else
        print_error "All medium job tests failed"
    fi
}

# Test algorithm performance
test_algorithms() {
    print_info "Testing different algorithms..."
    
    local algorithms=("beam_search_guillotine" "hybrid_constructive_local_search" "advanced_genetic_algorithm" "first_fit_decreasing")
    
    for algorithm in "${algorithms[@]}"; do
        print_info "Testing algorithm: $algorithm"
        
        local start_time=$(date +%s%3N)
        
        local response=$(curl -s -X POST "$SERVICE_URL/optimize" \
            -H "Content-Type: application/json" \
            -d "{
                \"algorithm\": \"$algorithm\",
                \"pieces\": [
                    {\"id\": \"rect1\", \"length\": 100, \"width\": 50, \"quantity\": 3, \"canRotate\": true, \"priority\": 1},
                    {\"id\": \"rect2\", \"length\": 75, \"width\": 60, \"quantity\": 2, \"canRotate\": false, \"priority\": 2}
                ],
                \"panel\": {\"length\": 400, \"width\": 300},
                \"settings\": {
                    \"kerf\": 3.2,
                    \"padding\": {\"left\": 10, \"right\": 10, \"top\": 10, \"bottom\": 10},
                    \"cutPreference\": \"hybrid\"
                }
            }")
        
        local end_time=$(date +%s%3N)
        local duration=$((end_time - start_time))
        
        if echo "$response" | grep -q '"success":true'; then
            local efficiency=$(echo "$response" | grep -o '"efficiency":[0-9.]*' | cut -d: -f2)
            print_status "$algorithm: ${duration}ms, Efficiency: ${efficiency}"
        else
            print_error "$algorithm: Failed after ${duration}ms"
        fi
        
        # Delay between algorithm tests
        sleep 1
    done
}

# Test concurrent requests
test_concurrent() {
    print_info "Testing concurrent requests (5 simultaneous)..."
    
    local start_time=$(date +%s%3N)
    
    # Start 5 concurrent requests
    for i in $(seq 1 5); do
        (
            local response=$(curl -s -X POST "$SERVICE_URL/optimize" \
                -H "Content-Type: application/json" \
                -d '{
                    "pieces": [
                        {"id": "rect1", "length": 100, "width": 50, "quantity": 2, "canRotate": true, "priority": 1}
                    ],
                    "panel": {"length": 300, "width": 200},
                    "settings": {
                        "kerf": 3.2,
                        "padding": {"left": 5, "right": 5, "top": 5, "bottom": 5}
                    }
                }')
            
            if echo "$response" | grep -q '"success":true'; then
                echo "Concurrent request $i: SUCCESS"
            else
                echo "Concurrent request $i: FAILED"
            fi
        ) &
    done
    
    # Wait for all requests to complete
    wait
    
    local end_time=$(date +%s%3N)
    local total_duration=$((end_time - start_time))
    
    print_info "Concurrent test completed in ${total_duration}ms"
}

# Main execution
main() {
    echo -e "${BLUE}🚀 Starting CNC Optimization Service Performance Tests${NC}"
    echo "Target response time: ${TARGET_RESPONSE_TIME}ms"
    echo "Test iterations: ${TEST_ITERATIONS}"
    echo ""
    
    check_service
    
    echo -e "${BLUE}📊 Running Performance Tests${NC}"
    echo ""
    
    test_small_job
    echo ""
    
    test_medium_job
    echo ""
    
    test_algorithms
    echo ""
    
    test_concurrent
    echo ""
    
    print_status "Performance testing completed!"
    print_info "Check the results above to ensure the service meets performance requirements"
}

# Run main function
main "$@"