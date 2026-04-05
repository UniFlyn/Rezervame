import 'package:flutter/material.dart';
import 'package:easy_localization/easy_localization.dart';
import '../utils/app_colors.dart';
import '../utils/app_typography.dart';
import 'main_navigation.dart';

class OnboardingScreen extends StatefulWidget {
  const OnboardingScreen({super.key});

  @override
  State<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends State<OnboardingScreen> {
  final PageController _controller = PageController();
  int _currentIndex = 0;

  final Color _primary = AppColors.primary500;
  final Color _bg = AppColors.white;

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
                        child: Image.asset('assets/logo_wide.png', height: 18, fit: BoxFit.contain),
                     ),
                  ),
                  GestureDetector(
                    onTap: _skip,
                    child: Text('skip'.tr(), style: AppTypography.heading300.copyWith(color: _primary)),
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
                        color: isActive ? _primary : _primary.withOpacity(0.15),
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
                      imgUrl: 'assets/family_illustration.png', 
                      isLocal: true,
                      stepTitle: 'onboardingStep1Title'.tr(),
                      title: 'onboardingSlide1Title'.tr(),
                      subBold: 'onboardingSlide1SubBold'.tr(),
                      sub: 'onboardingSlide1Sub'.tr(),
                    ),
                    _buildCenterSlide(
                      stepIndex: 2,
                      imgUrl: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=600&fit=crop', 
                      stepTitle: 'onboardingStep2Title'.tr(),
                      title: 'onboardingSlide2Title'.tr(),
                      subBold: '',
                      sub: 'onboardingSlide2Sub'.tr(),
                      bottomText: 'onboardingSlide2Bottom'.tr(),
                    ),
                    _buildCenterSlide(
                      stepIndex: 3,
                      imgUrl: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?q=80&w=600&fit=crop', 
                      stepTitle: 'onboardingStep3Title'.tr(),
                      title: 'onboardingSlide3Title'.tr(),
                      subBold: '',
                      sub: 'onboardingSlide3Sub'.tr(),
                      bottomText: 'onboardingSlide3Bottom'.tr(),
                    ),
                    _buildCenterSlide(
                      stepIndex: 4,
                      imgUrl: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?q=80&w=600&fit=crop', 
                      stepTitle: 'onboardingStep4Title'.tr(),
                      title: 'onboardingSlide4Title'.tr(),
                      titleIsRich: true,
                      subBold: '',
                      sub: 'onboardingSlide4Sub'.tr(),
                      bottomText: 'onboardingSlide4Bottom'.tr(),
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
                    backgroundColor: _primary,
                    elevation: 0,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text(isLast ? 'getStarted'.tr() : 'next'.tr(), style: AppTypography.heading400.copyWith(color: Colors.white)),
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
    bool isLocal = false,
    String? bottomText,
  }) {
    final imageWidget = isLocal
        ? Image.asset(imgUrl, fit: BoxFit.cover)
        : Image.network(imgUrl, fit: BoxFit.cover);

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
                  child: imageWidget,
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
                            Icon(stepIndex == 2 ? Icons.calendar_month : Icons.verified, color: _primary, size: 16),
                            const SizedBox(width: 8),
                            Text(stepTitle, style: AppTypography.heading200.copyWith(fontSize: 11, letterSpacing: 1)),
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
                               CircleAvatar(backgroundColor: _primary, radius: 16, child: const Icon(Icons.check, color: Colors.white, size: 18)),
                               const SizedBox(width: 12),
                               Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text('onboardingConfirmPill'.tr(), style: AppTypography.heading300),
                                    Text('onboardingSecured'.tr(), style: AppTypography.body100.copyWith(color: AppColors.grey500))
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
                    Align(alignment: Alignment.centerLeft, child: Text(stepTitle, style: AppTypography.body100.copyWith(fontWeight: FontWeight.bold, color: AppColors.grey500, letterSpacing: 1))),
                    const SizedBox(height: 12),
                    Align(
                      alignment: Alignment.centerLeft,
                      child: Text(title, style: AppTypography.heading900.copyWith(fontSize: 36, height: 1.1)),
                    ),
                    const SizedBox(height: 24),
                    if (subBold.isNotEmpty) Align(alignment: Alignment.centerLeft, child: Text(subBold, style: AppTypography.heading400)),
                    const SizedBox(height: 16),
                    Align(alignment: Alignment.centerLeft, child: Text(sub, style: AppTypography.body200.copyWith(height: 1.6, color: AppColors.grey500))),
                  ] else ...[
                    if (stepIndex == 2) Text(stepTitle.split(':')[0], style: AppTypography.body100.copyWith(fontWeight: FontWeight.bold, color: AppColors.grey500, letterSpacing: 1)),
                    const SizedBox(height: 12),
                    if (titleIsRich)
                      RichText(
                        textAlign: TextAlign.center,
                        text: TextSpan(
                          style: AppTypography.heading900.copyWith(fontSize: 36, height: 1.1),
                          children: [
                            const TextSpan(text: 'Pure '),
                            TextSpan(text: 'Bliss ', style: TextStyle(fontStyle: FontStyle.italic, color: _primary)),
                            const TextSpan(text: 'Awaits.'),
                          ],
                        ),
                      )
                    else
                    Text(title, style: AppTypography.heading900.copyWith(fontSize: 36, height: 1.1), textAlign: TextAlign.center),
                    const SizedBox(height: 24),
                    Text(sub, textAlign: TextAlign.center, style: AppTypography.body200.copyWith(height: 1.6, color: AppColors.grey500)),
                  ],
                  const Spacer(),
                  if (bottomText != null) ...[
                    Text(bottomText, style: AppTypography.body100.copyWith(color: AppColors.grey400, letterSpacing: 0.5)),
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
                  decoration: BoxDecoration(color: _primary.withOpacity(0.1), borderRadius: BorderRadius.circular(12)),
                  child: Icon(Icons.auto_awesome, color: _primary),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('onboardingCuratedTitle'.tr(), style: AppTypography.heading300),
                      const SizedBox(height: 2),
                      Text('onboardingCuratedSub'.tr(), style: AppTypography.body100.copyWith(color: AppColors.grey500)),
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
            child: Text('skip'.tr().toUpperCase(), style: AppTypography.heading200.copyWith(letterSpacing: 1.2, color: AppColors.grey900)),
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
                Image.asset('assets/logo_wide.png', height: 28, fit: BoxFit.contain),
                const SizedBox(height: 24),
                RichText(
                  textAlign: TextAlign.center,
                  text: TextSpan(
                    style: AppTypography.heading900.copyWith(fontSize: 42, height: 1.1),
                    children: [
                      const TextSpan(text: 'Your Beauty\n'),
                      TextSpan(text: 'Journey ', style: TextStyle(fontStyle: FontStyle.italic, color: _primary)),
                      const TextSpan(text: 'Starts Here'),
                    ],
                  ),
                ),
                const SizedBox(height: 24),
                Text(
                  'onboardingWelcomeSub'.tr(),
                  textAlign: TextAlign.center,
                  style: AppTypography.body200.copyWith(height: 1.5),
                ),
                const SizedBox(height: 32),
                SizedBox(
                  width: double.infinity,
                  height: 56,
                  child: ElevatedButton(
                    onPressed: _nextPage,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: _primary,
                      elevation: 4,
                      shadowColor: _primary.withOpacity(0.3),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Text('getStarted'.tr(), style: AppTypography.heading400.copyWith(color: Colors.white)),
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
