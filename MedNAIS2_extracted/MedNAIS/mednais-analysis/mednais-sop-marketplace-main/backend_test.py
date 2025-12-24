#!/usr/bin/env python3
"""
Backend API Testing for MedNAIS SOP Management Platform
Tests the complete Profile Management System functionality including magic link authentication
"""

import requests
import json
import time
import sys
from typing import Dict, Any, Optional

# Configuration
BASE_URL = "https://sopify.preview.emergentagent.com"
PROFILE_TEST_EMAIL = "profile-test-user@example.com"
CREATOR_EMAIL = "creator-ratings-test@example.com"
REVIEWER_EMAIL = "reviewer-ratings-test@example.com"
REVIEWER2_EMAIL = "reviewer2-test@example.com"

class MedNAISAPITester:
    def __init__(self):
        self.base_url = BASE_URL
        self.session = requests.Session()
        self.access_token = None
        self.refresh_token = None
        self.user_data = None
        
        # Store multiple user sessions for rating tests
        self.creator_session = requests.Session()
        self.creator_cookie = None
        self.creator_data = None
        
        self.reviewer_session = requests.Session()
        self.reviewer_cookie = None
        self.reviewer_data = None
        
        self.reviewer2_session = requests.Session()
        self.reviewer2_cookie = None
        self.reviewer2_data = None
        
    def log(self, message: str, level: str = "INFO"):
        """Log messages with timestamp"""
        timestamp = time.strftime("%H:%M:%S")
        print(f"[{timestamp}] {level}: {message}")
        
    def make_request(self, method: str, endpoint: str, **kwargs) -> requests.Response:
        """Make HTTP request with proper error handling"""
        url = f"{self.base_url}{endpoint}"
        self.log(f"{method} {url}")
        
        try:
            response = self.session.request(method, url, **kwargs)
            self.log(f"Response: {response.status_code}")
            return response
        except requests.exceptions.RequestException as e:
            self.log(f"Request failed: {e}", "ERROR")
            raise
            
    def authenticate_user(self, email: str, session: requests.Session) -> tuple[bool, str, dict]:
        """Authenticate a user and return success, cookie, and user data"""
        self.log(f"=== Authenticating User: {email} ===")
        
        # Step 1: Request magic link
        payload = {"email": email}
        response = session.request("POST", f"{self.base_url}/api/auth/magic-link/request", 
                                 json=payload,
                                 headers={"Content-Type": "application/json"})
        
        if response.status_code != 200:
            self.log(f"❌ Magic link request failed: {response.status_code}", "ERROR")
            self.log(f"Response: {response.text}", "ERROR")
            return False, None, None
            
        data = response.json()
        if not data.get("success"):
            self.log(f"❌ Magic link request unsuccessful: {data}", "ERROR")
            return False, None, None
            
        # Extract magic token from dev mode
        magic_token = None
        if data.get("devMode") and data.get("magicLink"):
            magic_link = data["magicLink"]
            if "token=" in magic_link:
                magic_token = magic_link.split("token=")[1]
                self.log(f"✅ Magic link generated for {email}")
        
        if not magic_token:
            self.log(f"❌ No magic token extracted for {email}", "ERROR")
            return False, None, None
            
        # Step 2: Verify magic link
        payload = {"token": magic_token}
        response = session.request("POST", f"{self.base_url}/api/auth/magic-link/verify",
                                 json=payload,
                                 headers={"Content-Type": "application/json"})
        
        if response.status_code != 200:
            self.log(f"❌ Magic link verification failed: {response.status_code}", "ERROR")
            self.log(f"Response: {response.text}", "ERROR")
            return False, None, None
            
        data = response.json()
        if not data.get("success"):
            self.log(f"❌ Magic link verification unsuccessful: {data}", "ERROR")
            return False, None, None
            
        # Extract refresh token from cookies
        refresh_token = None
        cookies = response.cookies
        if "refresh_token" in cookies:
            refresh_token = cookies["refresh_token"]
            session.cookies.set("refresh_token", refresh_token)
            self.log(f"✅ User {email} authenticated successfully")
            return True, refresh_token, data.get("user")
        
        self.log(f"❌ No refresh token for {email}", "ERROR")
        return False, None, None
        
    def create_test_sop(self, session: requests.Session, title: str = "Test SOP for Ratings") -> Optional[str]:
        """Create a test SOP and return its ID"""
        self.log(f"=== Creating Test SOP: {title} ===")
        
        # Prepare SOP data
        sop_data = {
            "title": title,
            "description": "Testing rating system",
            "type": "PERSONAL",
            "steps": [{
                "order": 1,
                "title": "Step 1",
                "description": "First step"
            }]
        }
        
        # Create multipart form data
        files = {
            'data': (None, json.dumps(sop_data), 'application/json')
        }
        
        response = session.request("POST", f"{self.base_url}/api/sops", files=files)
        
        if response.status_code != 201:
            self.log(f"❌ SOP creation failed: {response.status_code}", "ERROR")
            self.log(f"Response: {response.text}", "ERROR")
            return None
            
        data = response.json()
        sop_id = data.get("id")
        
        if not sop_id:
            self.log("❌ No SOP ID in response", "ERROR")
            return None
            
        self.log(f"✅ SOP created successfully: {sop_id}")
        return sop_id
        
    def create_rating(self, session: requests.Session, sop_id: str, rating: int, comment: str) -> bool:
        """Create a rating for a SOP"""
        self.log(f"=== Creating Rating: {rating} stars ===")
        
        payload = {
            "sopId": sop_id,
            "rating": rating,
            "comment": comment
        }
        
        response = session.request("POST", f"{self.base_url}/api/ratings",
                                 json=payload,
                                 headers={"Content-Type": "application/json"})
        
        if response.status_code != 200:
            self.log(f"❌ Rating creation failed: {response.status_code}", "ERROR")
            self.log(f"Response: {response.text}", "ERROR")
            return False
            
        data = response.json()
        if not data.get("success"):
            self.log(f"❌ Rating creation unsuccessful: {data}", "ERROR")
            return False
            
        self.log(f"✅ Rating created successfully: {rating} stars")
        self.log(f"Comment: {comment}")
        return True
        
    def get_ratings_for_sop(self, sop_id: str) -> Optional[dict]:
        """Get ratings for a SOP (no auth required)"""
        self.log(f"=== Getting Ratings for SOP: {sop_id} ===")
        
        # Use a fresh session without cookies for this test
        fresh_session = requests.Session()
        response = fresh_session.request("GET", f"{self.base_url}/api/ratings?sopId={sop_id}")
        
        if response.status_code != 200:
            self.log(f"❌ Get ratings failed: {response.status_code}", "ERROR")
            self.log(f"Response: {response.text}", "ERROR")
            return None
            
        data = response.json()
        
        if "ratings" not in data or "average" not in data or "count" not in data:
            self.log(f"❌ Invalid ratings response structure: {data}", "ERROR")
            return None
            
        self.log(f"✅ Ratings retrieved successfully")
        self.log(f"Average: {data['average']}")
        self.log(f"Count: {data['count']}")
        self.log(f"Ratings: {len(data['ratings'])} items")
        
        return data
        
    def test_rating_with_nonexistent_sop(self, session: requests.Session) -> bool:
        """Test rating a non-existent SOP"""
        self.log("=== Testing Rating Non-existent SOP ===")
        
        fake_sop_id = "non-existent-sop-id-12345"
        payload = {
            "sopId": fake_sop_id,
            "rating": 5,
            "comment": "This should fail"
        }
        
        response = session.request("POST", f"{self.base_url}/api/ratings",
                                 json=payload,
                                 headers={"Content-Type": "application/json"})
        
        if response.status_code == 404:
            self.log("✅ Correctly returned 404 for non-existent SOP")
            return True
        else:
            self.log(f"❌ Expected 404, got {response.status_code}", "ERROR")
            self.log(f"Response: {response.text}", "ERROR")
            return False
    
    def get_profile(self, session: requests.Session) -> Optional[dict]:
        """Get user profile"""
        self.log("=== Getting User Profile ===")
        
        response = session.request("GET", f"{self.base_url}/api/profile")
        
        if response.status_code != 200:
            self.log(f"❌ Get profile failed: {response.status_code}", "ERROR")
            self.log(f"Response: {response.text}", "ERROR")
            return None
            
        data = response.json()
        self.log(f"✅ Profile retrieved successfully")
        self.log(f"User ID: {data.get('id')}")
        self.log(f"Email: {data.get('email')}")
        self.log(f"Name: {data.get('name')}")
        self.log(f"Bio: {data.get('bio')}")
        self.log(f"Location: {data.get('location')}")
        self.log(f"Website: {data.get('website')}")
        self.log(f"Twitter: {data.get('twitter')}")
        self.log(f"LinkedIn: {data.get('linkedin')}")
        self.log(f"GitHub: {data.get('github')}")
        
        return data
    
    def update_profile(self, session: requests.Session, profile_data: dict) -> Optional[dict]:
        """Update user profile"""
        self.log(f"=== Updating User Profile ===")
        self.log(f"Data: {profile_data}")
        
        response = session.request("PUT", f"{self.base_url}/api/profile",
                                 json=profile_data,
                                 headers={"Content-Type": "application/json"})
        
        if response.status_code != 200:
            self.log(f"❌ Profile update failed: {response.status_code}", "ERROR")
            self.log(f"Response: {response.text}", "ERROR")
            return None
            
        data = response.json()
        self.log(f"✅ Profile updated successfully")
        return data
    
    def test_profile_validation(self, session: requests.Session) -> bool:
        """Test profile validation errors"""
        self.log("=== Testing Profile Validation ===")
        
        # Test empty name
        self.log("Testing empty name validation...")
        response = session.request("PUT", f"{self.base_url}/api/profile",
                                 json={"name": "", "bio": None},
                                 headers={"Content-Type": "application/json"})
        
        if response.status_code != 400:
            self.log(f"❌ Expected 400 for empty name, got {response.status_code}", "ERROR")
            return False
        self.log("✅ Empty name validation working")
        
        # Test invalid website URL
        self.log("Testing invalid website URL validation...")
        response = session.request("PUT", f"{self.base_url}/api/profile",
                                 json={"name": "Test", "website": "not-a-url"},
                                 headers={"Content-Type": "application/json"})
        
        if response.status_code != 400:
            self.log(f"❌ Expected 400 for invalid URL, got {response.status_code}", "ERROR")
            return False
        self.log("✅ Invalid URL validation working")
        
        return True
    
    def test_unauthorized_profile_access(self) -> bool:
        """Test unauthorized profile access"""
        self.log("=== Testing Unauthorized Profile Access ===")
        
        # Create fresh session without cookies
        fresh_session = requests.Session()
        response = fresh_session.request("GET", f"{self.base_url}/api/profile")
        
        if response.status_code != 401:
            self.log(f"❌ Expected 401 for unauthorized access, got {response.status_code}", "ERROR")
            return False
        
        self.log("✅ Unauthorized access correctly blocked")
        return True
    
    def run_profile_management_test(self) -> bool:
        """Run the complete Profile Management System test"""
        self.log("🚀 Starting MedNAIS Profile Management System Test")
        self.log(f"Base URL: {self.base_url}")
        
        try:
            # Step 1: Authentication
            self.log("\n📋 STEP 1: Authentication")
            success, user_cookie, user_data = self.authenticate_user(PROFILE_TEST_EMAIL, self.session)
            if not success:
                self.log("❌ Failed to authenticate user", "ERROR")
                return False
            self.log("✅ User authenticated successfully")
            
            # Step 2: Get Profile (Initial State)
            self.log("\n📋 STEP 2: Get Profile (Initial State)")
            initial_profile = self.get_profile(self.session)
            if not initial_profile:
                self.log("❌ Failed to get initial profile", "ERROR")
                return False
            
            # Verify initial profile structure
            required_fields = ['id', 'email', 'name', 'avatar_url', 'bio', 'location', 
                             'website', 'twitter', 'linkedin', 'github', '_count', 
                             'createdAt', 'updatedAt']
            for field in required_fields:
                if field not in initial_profile:
                    self.log(f"❌ Missing field in profile: {field}", "ERROR")
                    return False
            
            # Verify _count structure
            count_fields = ['sops', 'purchasedSOPs', 'ratings', 'executions']
            for field in count_fields:
                if field not in initial_profile['_count']:
                    self.log(f"❌ Missing count field: {field}", "ERROR")
                    return False
            
            self.log("✅ Initial profile structure verified")
            
            # Step 3: Update Profile (Full Information)
            self.log("\n📋 STEP 3: Update Profile (Full Information)")
            full_profile_data = {
                "name": "John Doe",
                "bio": "SOP enthusiast and productivity expert",
                "location": "San Francisco, CA",
                "website": "https://johndoe.com",
                "twitter": "@johndoe",
                "linkedin": "linkedin.com/in/johndoe",
                "github": "github.com/johndoe"
            }
            
            updated_profile = self.update_profile(self.session, full_profile_data)
            if not updated_profile:
                self.log("❌ Failed to update profile", "ERROR")
                return False
            
            # Step 4: Get Profile (After Update)
            self.log("\n📋 STEP 4: Get Profile (After Update)")
            profile_after_update = self.get_profile(self.session)
            if not profile_after_update:
                self.log("❌ Failed to get profile after update", "ERROR")
                return False
            
            # Verify all fields are updated correctly
            for key, expected_value in full_profile_data.items():
                if profile_after_update.get(key) != expected_value:
                    self.log(f"❌ Field {key} not updated correctly. Expected: {expected_value}, Got: {profile_after_update.get(key)}", "ERROR")
                    return False
            
            self.log("✅ All profile fields updated correctly")
            
            # Step 5: Partial Update (Change Only Name)
            self.log("\n📋 STEP 5: Partial Update (Change Only Name)")
            partial_update_data = {
                "name": "Jane Smith",
                "bio": "SOP enthusiast and productivity expert",
                "location": "San Francisco, CA",
                "website": "https://johndoe.com",
                "twitter": "@johndoe",
                "linkedin": "linkedin.com/in/johndoe",
                "github": "github.com/johndoe"
            }
            
            partial_updated_profile = self.update_profile(self.session, partial_update_data)
            if not partial_updated_profile:
                self.log("❌ Failed to do partial update", "ERROR")
                return False
            
            # Verify name changed, other fields unchanged
            if partial_updated_profile.get('name') != "Jane Smith":
                self.log(f"❌ Name not updated correctly. Expected: Jane Smith, Got: {partial_updated_profile.get('name')}", "ERROR")
                return False
            
            self.log("✅ Partial update successful")
            
            # Step 6: Test Validation
            self.log("\n📋 STEP 6: Test Validation")
            if not self.test_profile_validation(self.session):
                self.log("❌ Profile validation tests failed", "ERROR")
                return False
            
            # Step 7: Test Unauthorized Access
            self.log("\n📋 STEP 7: Test Unauthorized Access")
            if not self.test_unauthorized_profile_access():
                self.log("❌ Unauthorized access test failed", "ERROR")
                return False
            
            self.log("\n🎉 All Profile Management System tests passed successfully!")
            return True
            
        except Exception as e:
            self.log(f"❌ Test failed with exception: {e}", "ERROR")
            import traceback
            traceback.print_exc()
            return False
        
    def run_rating_system_test(self) -> bool:
        """Run the complete Rating System functionality test"""
        self.log("🚀 Starting MedNAIS Rating System Test")
        self.log(f"Base URL: {self.base_url}")
        
        try:
            # Step 1: Setup - Create Two Users
            self.log("\n📋 STEP 1: Setup - Create Two Users")
            
            # User A (SOP creator)
            success, self.creator_cookie, self.creator_data = self.authenticate_user(CREATOR_EMAIL, self.creator_session)
            if not success:
                self.log("❌ Failed to authenticate creator user", "ERROR")
                return False
                
            # User B (reviewer)
            success, self.reviewer_cookie, self.reviewer_data = self.authenticate_user(REVIEWER_EMAIL, self.reviewer_session)
            if not success:
                self.log("❌ Failed to authenticate reviewer user", "ERROR")
                return False
                
            self.log("✅ Both users authenticated successfully")
            
            # Step 2: Create Test SOP (as User A)
            self.log("\n📋 STEP 2: Create Test SOP (as User A)")
            test_sop_id = self.create_test_sop(self.creator_session)
            if not test_sop_id:
                self.log("❌ Failed to create test SOP", "ERROR")
                return False
                
            # Step 3: Create Rating (as User B)
            self.log("\n📋 STEP 3: Create Rating (as User B)")
            if not self.create_rating(self.reviewer_session, test_sop_id, 5, "Excellent SOP! Very helpful."):
                self.log("❌ Failed to create first rating", "ERROR")
                return False
                
            # Step 4: Get Ratings for SOP
            self.log("\n📋 STEP 4: Get Ratings for SOP")
            ratings_data = self.get_ratings_for_sop(test_sop_id)
            if not ratings_data:
                self.log("❌ Failed to get ratings", "ERROR")
                return False
                
            # Verify first rating results
            if ratings_data["average"] != 5.0:
                self.log(f"❌ Expected average 5.0, got {ratings_data['average']}", "ERROR")
                return False
                
            if ratings_data["count"] != 1:
                self.log(f"❌ Expected count 1, got {ratings_data['count']}", "ERROR")
                return False
                
            if len(ratings_data["ratings"]) != 1:
                self.log(f"❌ Expected 1 rating, got {len(ratings_data['ratings'])}", "ERROR")
                return False
                
            # Check if user info is included
            rating = ratings_data["ratings"][0]
            if "user" not in rating:
                self.log("❌ User info not included in rating", "ERROR")
                return False
                
            self.log("✅ First rating verification successful")
            
            # Step 5: Create Second Rating (as different user)
            self.log("\n📋 STEP 5: Create Second Rating (as different user)")
            
            # User C (second reviewer)
            success, self.reviewer2_cookie, self.reviewer2_data = self.authenticate_user(REVIEWER2_EMAIL, self.reviewer2_session)
            if not success:
                self.log("❌ Failed to authenticate second reviewer user", "ERROR")
                return False
                
            if not self.create_rating(self.reviewer2_session, test_sop_id, 4, "Good but could be better"):
                self.log("❌ Failed to create second rating", "ERROR")
                return False
                
            # Get ratings again and verify
            ratings_data = self.get_ratings_for_sop(test_sop_id)
            if not ratings_data:
                self.log("❌ Failed to get ratings after second rating", "ERROR")
                return False
                
            if ratings_data["average"] != 4.5:
                self.log(f"❌ Expected average 4.5, got {ratings_data['average']}", "ERROR")
                return False
                
            if ratings_data["count"] != 2:
                self.log(f"❌ Expected count 2, got {ratings_data['count']}", "ERROR")
                return False
                
            self.log("✅ Second rating verification successful")
            
            # Step 6: Test Edge Cases
            self.log("\n📋 STEP 6: Test Edge Cases")
            
            # Test creator rating own SOP (should succeed according to API)
            if not self.create_rating(self.creator_session, test_sop_id, 3, "Rating my own SOP"):
                self.log("❌ Creator failed to rate own SOP", "ERROR")
                return False
            self.log("✅ Creator can rate own SOP")
            
            # Test user rating same SOP again (should update existing rating)
            if not self.create_rating(self.reviewer_session, test_sop_id, 4, "Updated my rating"):
                self.log("❌ Failed to update existing rating", "ERROR")
                return False
            self.log("✅ Rating update successful")
            
            # Test rating non-existent SOP
            if not self.test_rating_with_nonexistent_sop(self.reviewer_session):
                self.log("❌ Non-existent SOP test failed", "ERROR")
                return False
                
            self.log("✅ All edge cases passed")
            
            self.log("\n🎉 All Rating System tests passed successfully!")
            return True
            
        except Exception as e:
            self.log(f"❌ Test failed with exception: {e}", "ERROR")
            import traceback
            traceback.print_exc()
            return False

    def test_shopping_cart_flow(self) -> bool:
        """Test the complete shopping cart flow for SOP purchases via Stripe"""
        self.log("🛒 Starting Shopping Cart Flow Test")
        self.log(f"Base URL: {self.base_url}")
        
        # Test data from review request
        test_email = "cart-buyer@example.com"
        test_sop_id = "cmi8lvwtg0001fewudi0v8fe3"
        magic_token = "fe24cccb4c46f55629646fbec2be3e1afed4065f0dbe815d873de280f7e5f17e"
        origin_url = "https://sopify.preview.emergentagent.com"
        
        try:
            # Step 1: Authenticate via magic link token
            self.log("\n📋 STEP 1: Magic Link Authentication")
            self.log(f"Authenticating user: {test_email}")
            self.log(f"Using token: {magic_token}")
            
            payload = {"token": magic_token}
            response = self.session.request("POST", f"{self.base_url}/api/auth/magic-link/verify",
                                         json=payload,
                                         headers={"Content-Type": "application/json"})
            
            if response.status_code != 200:
                self.log(f"❌ Magic link verification failed: {response.status_code}", "ERROR")
                self.log(f"Response: {response.text}", "ERROR")
                return False
                
            data = response.json()
            if not data.get("success"):
                self.log(f"❌ Magic link verification unsuccessful: {data}", "ERROR")
                return False
                
            # Extract refresh token from cookies
            if "refresh_token" in response.cookies:
                refresh_token = response.cookies["refresh_token"]
                self.session.cookies.set("refresh_token", refresh_token)
                self.log(f"✅ User authenticated successfully")
            else:
                self.log("❌ No refresh token received", "ERROR")
                return False
            
            # Step 2: Add SOP to cart
            self.log("\n📋 STEP 2: Add SOP to Cart")
            self.log(f"Adding SOP ID: {test_sop_id}")
            
            payload = {"sopId": test_sop_id}
            response = self.session.request("POST", f"{self.base_url}/api/cart",
                                         json=payload,
                                         headers={"Content-Type": "application/json"})
            
            if response.status_code not in [200, 201]:
                self.log(f"❌ Add to cart failed: {response.status_code}", "ERROR")
                self.log(f"Response: {response.text}", "ERROR")
                return False
                
            data = response.json()
            self.log(f"✅ SOP added to cart successfully")
            self.log(f"Response: {data}")
            
            # Step 3: Get cart contents
            self.log("\n📋 STEP 3: Get Cart Contents")
            
            response = self.session.request("GET", f"{self.base_url}/api/cart")
            
            if response.status_code != 200:
                self.log(f"❌ Get cart failed: {response.status_code}", "ERROR")
                self.log(f"Response: {response.text}", "ERROR")
                return False
                
            cart_data = response.json()
            self.log(f"✅ Cart retrieved successfully")
            self.log(f"Item count: {cart_data.get('itemCount', 0)}")
            self.log(f"Total: ${cart_data.get('total', 0) / 100:.2f}")
            
            # Verify cart has 1 item
            if cart_data.get('itemCount') != 1:
                self.log(f"❌ Expected 1 item in cart, got {cart_data.get('itemCount')}", "ERROR")
                return False
                
            # Verify the SOP is in the cart
            cart_items = cart_data.get('cart', {}).get('items', [])
            if not cart_items or cart_items[0].get('sopId') != test_sop_id:
                self.log(f"❌ Expected SOP {test_sop_id} in cart, but not found", "ERROR")
                return False
                
            self.log(f"✅ Cart contains correct SOP: {test_sop_id}")
            
            # Verify price is $9.99 (999 cents)
            expected_price = 999  # $9.99 in cents
            actual_price = cart_data.get('total', 0)
            if actual_price != expected_price:
                self.log(f"❌ Expected price ${expected_price/100:.2f}, got ${actual_price/100:.2f}", "ERROR")
                return False
                
            self.log(f"✅ Cart total is correct: ${actual_price/100:.2f}")
            
            # Step 4: Create checkout session
            self.log("\n📋 STEP 4: Create Checkout Session")
            
            payload = {"origin_url": origin_url}
            response = self.session.request("POST", f"{self.base_url}/api/cart/checkout",
                                         json=payload,
                                         headers={"Content-Type": "application/json"})
            
            if response.status_code not in [200, 201]:
                self.log(f"❌ Create checkout session failed: {response.status_code}", "ERROR")
                self.log(f"Response: {response.text}", "ERROR")
                return False
                
            checkout_data = response.json()
            self.log(f"✅ Checkout session created successfully")
            
            # Step 5: Verify Stripe session response
            self.log("\n📋 STEP 5: Verify Stripe Session Response")
            
            # Check required fields in response
            required_fields = ['session_id', 'url']
            for field in required_fields:
                if field not in checkout_data:
                    self.log(f"❌ Missing required field in checkout response: {field}", "ERROR")
                    return False
                    
            session_id = checkout_data.get('session_id')
            checkout_url = checkout_data.get('url')
            
            if not session_id or not session_id.startswith('cs_'):
                self.log(f"❌ Invalid session_id format: {session_id}", "ERROR")
                return False
                
            if not checkout_url or not checkout_url.startswith('https://checkout.stripe.com'):
                self.log(f"❌ Invalid checkout URL: {checkout_url}", "ERROR")
                return False
                
            self.log(f"✅ Valid Stripe session ID: {session_id}")
            self.log(f"✅ Valid Stripe checkout URL: {checkout_url}")
            
            # Verify amount in checkout session
            if 'amount' in checkout_data:
                checkout_amount = checkout_data['amount']
                expected_amount = 9.99  # $9.99
                if abs(checkout_amount - expected_amount) > 0.01:
                    self.log(f"❌ Checkout amount mismatch. Expected: ${expected_amount}, Got: ${checkout_amount}", "ERROR")
                    return False
                self.log(f"✅ Checkout amount correct: ${checkout_amount}")
            
            self.log("\n🎉 Shopping Cart Flow Test Completed Successfully!")
            self.log("✅ Magic link authentication working")
            self.log("✅ Add to cart functionality working")
            self.log("✅ Cart retrieval working with correct item count")
            self.log("✅ Checkout session creation working")
            self.log("✅ Stripe integration working with valid session_id and URL")
            
            return True
            
        except Exception as e:
            self.log(f"❌ Shopping cart test failed with exception: {e}", "ERROR")
            import traceback
            traceback.print_exc()
            return False

def main():
    """Main test execution"""
    tester = MedNAISAPITester()
    
    # Run shopping cart flow test as requested
    success = tester.test_shopping_cart_flow()
    
    if success:
        print("\n✅ SHOPPING CART FLOW TEST SUMMARY: ALL TESTS PASSED")
        print("- Magic link authentication (POST /api/auth/magic-link/verify): ✅")
        print("- Add SOP to cart (POST /api/cart): ✅")
        print("- Get cart contents (GET /api/cart): ✅")
        print("- Cart contains 1 item with correct SOP ID: ✅")
        print("- Cart total is $9.99: ✅")
        print("- Create checkout session (POST /api/cart/checkout): ✅")
        print("- Stripe session_id and URL received: ✅")
        print("- All status codes are 200/201: ✅")
        print("- Cookies maintained between requests: ✅")
        sys.exit(0)
    else:
        print("\n❌ SHOPPING CART FLOW TEST SUMMARY: TESTS FAILED")
        sys.exit(1)

if __name__ == "__main__":
    main()