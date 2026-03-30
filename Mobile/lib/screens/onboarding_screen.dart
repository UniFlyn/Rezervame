import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'main_navigation.dart';

class OnboardingScreen extends StatefulWidget {
  const OnboardingScreen({super.key});

  @override
  State<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends State<OnboardingScreen> {
  final PageController _controller = PageController();
  int _currentIndex = 0;

  final Color _red = const Color(0xFFE5414C);
  final Color _bg = const Color(0xFFFDF6F5);

  void _nextPage() {
    if (_currentIndex == 4) {
      Navigator.pushReplacement(context, MaterialPageRoute(builder: (_) => const MainNavigation()));
    } else {
      if (_currentIndex == 0) {
         setState(() {
           _currentIndex = 1;
         });
      } else {
         _controller.nextPage(duration: const Duration(milliseconds: 300), curve: Curves.easeInOut);
      }
    }
  }

  void _skip() {
    Navigator.pushReplacement(context, MaterialPageRoute(builder: (_) => const MainNavigation()));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: _bg,
      body: _currentIndex == 0 ? _buildWelcomeScreen() : _buildStaticSliderFrame(),
    );
  }

  Widget _buildStaticSliderFrame() {
     int sliderIndex = _currentIndex - 1; // 0 to 3
     bool isLast = sliderIndex == 3;

     return SafeArea(
       child: Padding(
         padding: const EdgeInsets.all(24.0),
         child: Column(
           children: [
              // Top Bar: Logo + Skip
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Expanded(
                     child: Align(
                       alignment: Alignment.centerLeft,
                       child: Image.asset('assets/logo.png', height: 26, fit: BoxFit.contain),
                     ),
                  ),
                  GestureDetector(
                    onTap: _skip,
                    child: Text('Skip', style: GoogleFonts.outfit(color: _red, fontWeight: FontWeight.bold, fontSize: 15)),
                  ),
                ],
              ),
              const SizedBox(height: 24),
              // Progress indicators (STATIC)
              Row(
                children: List.generate(4, (index) {
                  bool isActive = index == sliderIndex;
                  return Expanded(
                    child: Container(
                      margin: EdgeInsets.only(right: index == 3 ? 0 : 8),
                      height: 4,
                      decoration: BoxDecoration(
                        color: isActive ? _red : _red.withOpacity(0.15),
                        borderRadius: BorderRadius.circular(4),
                      ),
                    ),
                  );
                }),
              ),
              const SizedBox(height: 24),
              
              // ONLY THIS CENTER PART SLIDES
              Expanded(
                child: PageView(
                  controller: _controller,
                  physics: const ClampingScrollPhysics(),
                  onPageChanged: (idx) {
                     setState(() {
                       _currentIndex = idx + 1;
                     });
                  },
                  children: [
                    _buildCenterSlide(
                      stepIndex: 1,
                      imgUrl: 'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?q=80&w=600&fit=crop', // Fixed URL
                      stepTitle: 'STEP 01',
                      title: 'Descubre',
                      subBold: 'Find your next treatment...',
                      sub: 'Discover and book the most exclusive wellness experiences in your city with seamless ease.',
                    ),
                    _buildCenterSlide(
                      stepIndex: 2,
                      imgUrl: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=600&fit=crop', 
                      stepTitle: 'STEP 02: BOOKING',
                      title: 'Rezerva',
                      subBold: '',
                      sub: 'Select your service and a time that works for you. Your favorite beauty experts... just a tap away.',
                      bottomText: 'PERSONALIZED BEAUTY EXPERIENCES TAILORED TO YOU',
                    ),
                    _buildCenterSlide(
                      stepIndex: 3,
                      imgUrl: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?q=80&w=600&fit=crop', 
                      stepTitle: 'STEP 03: CONFIRM',
                      title: 'Everything is set!',
                      subBold: '',
                      sub: 'Receive instant confirmation and get ready to be pampered in our curated spaces.',
                      bottomText: 'STEP 03 / 04',
                    ),
                    _buildCenterSlide(
                      stepIndex: 4,
                      imgUrl: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?q=80&w=600&fit=crop', 
                      stepTitle: 'STEP 4: DISFRUTA',
                      title: 'Pure Bliss Awaits.',
                      titleIsRich: true,
                      subBold: '',
                      sub: 'The best part—showing up and enjoying your treatment. No stress, just pure relaxation.',
                      bottomText: 'WELCOME TO THE CURATED SANCTUARY OF PERSONAL CARE',
                    ),
                  ]
                )
              ),

              // STATIC BOTTOM BUTTON
              SizedBox(
                width: double.infinity,
                height: 56,
                child: ElevatedButton(
                  onPressed: _nextPage,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: _red,
                    elevation: 0,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(28)),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text(isLast ? 'Get Started' : 'Next', style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.white)),
                      const SizedBox(width: 12),
                      const Icon(Icons.arrow_forward, color: Colors.white, size: 20),
                    ],
                  ),
                ),
              ),
           ]
         )
       )
     );
  }

  Widget _buildCenterSlide({
    required int stepIndex,
    required String imgUrl,
    required String stepTitle,
    required String title,
    bool titleIsRich = false,
    required String subBold,
    required String sub,
    String? bottomText,
  }) {
      return Column(
          children: [
            // Image Card
            Expanded(
              flex: 12,
              child: Stack(
                children: [
                  ClipRRect(
                    borderRadius: BorderRadius.circular(24),
                    child: ConstrainedBox(
                       constraints: const BoxConstraints.expand(),
                       child: Image.network(imgUrl, fit: BoxFit.cover),
                    ),
                  ),
                  if (stepIndex == 2 || stepIndex == 4)
                    Positioned(
                      bottom: 20,
                      left: 20,
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                        decoration: BoxDecoration(color: Colors.white.withOpacity(0.9), borderRadius: BorderRadius.circular(20)),
                        child: Row(
                          children: [
                            Icon(stepIndex == 2 ? Icons.calendar_month : Icons.verified, color: _red, size: 16),
                            const SizedBox(width: 8),
                            Text(stepTitle, style: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 11, letterSpacing: 1)),
                          ],
                        ),
                      ),
                    ),
                  if (stepIndex == 3) // Cartoon Confirm style pill overlay
                    Positioned(
                      bottom: 0,
                      right: 0,
                      child: Container(
                         margin: const EdgeInsets.only(bottom: 12, right: 12),
                         padding: const EdgeInsets.all(12),
                         decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(12), boxShadow: const [BoxShadow(color: Colors.black12, blurRadius: 10)]),
                         child: Row(
                            children: [
                               CircleAvatar(backgroundColor: _red, radius: 16, child: const Icon(Icons.check, color: Colors.white, size: 18)),
                               const SizedBox(width: 12),
                               Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text('Confirma', style: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 14)),
                                    Text('Booking Secured', style: GoogleFonts.outfit(fontSize: 10, color: Colors.grey.shade600))
                                  ],
                               )
                            ],
                         ),
                      ),
                    ),
                ],
              ),
            ),
            const SizedBox(height: 32),
            // Bottom Text Content
            Expanded(
              flex: 10,
              child: Column(
                children: [
                  if (stepIndex == 1) ...[
                    Align(alignment: Alignment.centerLeft, child: Text(stepTitle, style: GoogleFonts.outfit(fontWeight: FontWeight.bold, color: Colors.grey.shade600, letterSpacing: 1, fontSize: 13))),
                    const SizedBox(height: 12),
                    Align(
                      alignment: Alignment.centerLeft,
                      child: Text(title, style: GoogleFonts.outfit(fontSize: 36, fontWeight: FontWeight.bold, color: Colors.black87, height: 1.1)),
                    ),
                    const SizedBox(height: 24),
                    if (subBold.isNotEmpty) Align(alignment: Alignment.centerLeft, child: Text(subBold, style: GoogleFonts.outfit(fontSize: 20, fontWeight: FontWeight.normal, color: Colors.black87))),
                    const SizedBox(height: 16),
                    Align(alignment: Alignment.centerLeft, child: Text(sub, style: GoogleFonts.outfit(fontSize: 15, color: Colors.grey.shade700, height: 1.5))),
                  ] else ...[
                    if (stepIndex == 2) Text(stepTitle.split(':')[0], style: GoogleFonts.outfit(fontWeight: FontWeight.bold, color: Colors.grey.shade600, letterSpacing: 1, fontSize: 13)),
                    const SizedBox(height: 12),
                    if (titleIsRich)
                      RichText(
                        textAlign: TextAlign.center,
                        text: TextSpan(
                          style: GoogleFonts.outfit(fontSize: 36, fontWeight: FontWeight.bold, color: Colors.black87, height: 1.1),
                          children: [
                            const TextSpan(text: 'Pure '),
                            TextSpan(text: 'Bliss ', style: GoogleFonts.playfairDisplay(fontStyle: FontStyle.italic, color: _red)),
                            const TextSpan(text: 'Awaits.'),
                          ],
                        ),
                      )
                    else
                      Text(title, style: GoogleFonts.outfit(fontSize: 36, fontWeight: FontWeight.bold, color: Colors.black87, height: 1.1), textAlign: TextAlign.center),
                    const SizedBox(height: 24),
                    Text(sub, textAlign: TextAlign.center, style: GoogleFonts.outfit(fontSize: 16, color: Colors.grey.shade700, height: 1.5)),
                  ],
                  const Spacer(),
                  if (bottomText != null) ...[
                    Text(bottomText, style: GoogleFonts.outfit(fontSize: 10, color: Colors.grey.shade500, letterSpacing: 0.5)),
                    const SizedBox(height: 16),
                  ]
                ],
              ),
            ),
          ],
      );
  }

  Widget _buildWelcomeScreen() {
    return Stack(
      children: [
        // Background Image Top
        Positioned(
          top: 0,
          left: 0,
          right: 0,
          height: MediaQuery.of(context).size.height * 0.55,
          child: Image.network(
            'https://images.unsplash.com/photo-1522337660859-02fbefca4702?q=80&w=800&fit=crop',
            fit: BoxFit.cover,
          ),
        ),
        // Gradient to blend into bg color
        Positioned(
          top: MediaQuery.of(context).size.height * 0.35,
          left: 0,
          right: 0,
          height: MediaQuery.of(context).size.height * 0.2,
          child: Container(
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
                colors: [Colors.transparent, _bg],
              ),
            ),
          ),
        ),
        // Floating Card
        Positioned(
          top: MediaQuery.of(context).size.height * 0.45,
          left: 32,
          right: 32,
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.9),
              borderRadius: BorderRadius.circular(20),
              boxShadow: const [BoxShadow(color: Colors.black12, blurRadius: 20, offset: Offset(0, 10))],
            ),
            child: Row(
              children: [
                Container(
                  width: 44,
                  height: 44,
                  decoration: BoxDecoration(color: _red.withOpacity(0.15), borderRadius: BorderRadius.circular(12)),
                  child: Icon(Icons.auto_awesome, color: _red),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Curated Excellence', style: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 14)),
                      const SizedBox(height: 2),
                      Text('Top-tier treatments nearby', style: GoogleFonts.outfit(color: Colors.grey.shade600, fontSize: 12)),
                    ],
                  ),
                )
              ],
            ),
          ),
        ),
        // Skip Button Top Right
        Positioned(
          top: 50,
          right: 24,
          child: GestureDetector(
            onTap: _skip,
            child: Text('SKIP', style: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 13, letterSpacing: 1)),
          ),
        ),
        // Bottom Content
        Positioned(
          bottom: 0,
          left: 0,
          right: 0,
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 32.0, vertical: 40),
            child: Column(
              children: [
                Image.asset('assets/logo.png', height: 28, fit: BoxFit.contain),
                const SizedBox(height: 24),
                RichText(
                  textAlign: TextAlign.center,
                  text: TextSpan(
                    style: GoogleFonts.outfit(fontSize: 42, fontWeight: FontWeight.bold, color: Colors.black87, height: 1.1),
                    children: [
                      const TextSpan(text: 'Your Beauty\n'),
                      TextSpan(text: 'Journey ', style: GoogleFonts.playfairDisplay(fontStyle: FontStyle.italic, color: _red)),
                      const TextSpan(text: 'Starts Here'),
                    ],
                  ),
                ),
                const SizedBox(height: 24),
                Text(
                  'Discover and book the most exclusive wellness experiences in your city with seamless ease.',
                  textAlign: TextAlign.center,
                  style: GoogleFonts.outfit(fontSize: 15, color: Colors.grey.shade700, height: 1.5),
                ),
                const SizedBox(height: 32),
                SizedBox(
                  width: double.infinity,
                  height: 56,
                  child: ElevatedButton(
                    onPressed: _nextPage,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: _red,
                      elevation: 4,
                      shadowColor: _red.withOpacity(0.5),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(28)),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Text('Get Started', style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.white)),
                        const SizedBox(width: 12),
                        const Icon(Icons.arrow_forward, color: Colors.white, size: 20),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}
