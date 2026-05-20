# AION Portrait Master — 33 Parámetros

Referencia completa de parámetros para el nodo `AionFluxPrompterNode` (nodo 82 en el workflow).

## Demographics
- `sex`: female
- `ethnicity`: Latin American | Mestizo | Caribbean | Afro-Caribbean | South American
- `photo_type`: Studio white background | Studio black background | Natural light portrait | Fashion editorial

## Eye System
- `eye_shape`: almond-shaped | round | upturned | hooded | monolid
- `eye_size`: large | medium | small | very large
- `eye_tilt`: slight upward tilt | neutral tilt | moderate upward tilt | downward tilt
- `eye_color`: dark brown | brown | amber | hazel | green | light brown
- `eyebrow_thickness`: thick | medium thickness | dense and full | thin
- `eyebrow_shape`: high arch | soft arch | straight | angled | rounded
- `eyebrow_color`: dark brown | medium brown | black | light brown

## Nose
- `nose_profile`: slightly convex | high bridge | broad bridge | button nose profile | straight
- `nose_base`: medium base | wide base | narrow base | compact nostrils
- `nose_tip`: rounded tip | broad tip | upturned tip | refined tip | pointed tip

## Lips
- `lips_volume`: very full lips | full lips | naturally plump | medium volume
- `cupid_bow`: pronounced cupid's bow | heart-shaped cupid's bow | rounded cupid's bow | sharply defined bow
- `lips_proportion`: fuller lower lip | balanced upper and lower | slightly fuller lower
- `lips_color`: coral toned | rosy pink | brownish pink | deep rose | nude pink | berry

## Facial Structure
- `forehead`: average proportion | low forehead | narrow forehead | wide forehead
- `cheekbones`: high cheekbones | prominent cheekbones | wide-set cheekbones | angular cheekbones
- `jawline`: soft jawline | defined jawline | rounded jawline | tapered jawline | sharp jawline
- `chin`: rounded chin | soft chin | pointed chin | square chin
- `cheeks`: apple cheeks | full cheeks | soft rounded cheeks | lean cheeks
- `submental`: tight submental area | soft submental area | defined under-chin
- `face_neck_transition`: smooth transition | defined angle | elongated neck line

## Hair
- `hair_structure`: wavy | straight | loosely wavy | curly | coily
- `hair_length`: long | very long | shoulder length | mid-back length | short
- `hair_volume`: high volume | thick and dense | very voluminous | medium volume
- `hair_color`: dark brown | jet black | medium brown | dark auburn | golden brown | black

## Skin
- `skin_tone`: light | medium | medium-tan | olive | deep tan | tan
- `skin_undertone`: warm undertone | golden undertone | olive undertone | neutral undertone
- `skin_texture`: smooth natural grain | natural skin grain | soft velvety texture
- `skin_micro_texture`: visible fine pores | natural pore variation | subtle pore detail | realistic micro detail
- `skin_imperfections`: none visible | light freckles | subtle freckles | light acne marks
- `skin_reflection`: natural dewy glow | matte natural finish | satin finish

## Skin Defects (ninguno para modelos)
Todos en `none`: wrinkles, scars, deformations, tone_loss, skin_marks, vitiligo, under_eye

## Expression
- `expression`: happiness | neutral | slight smile | surprise
- `expression_variant`: radiant joy | Duchenne smile | warm smile | determined | confident | smirk | serene

## Uso en el workflow
```javascript
wf["82"]["inputs"]["ethnicity"] = "Latin American"
wf["82"]["inputs"]["skin_tone"] = "medium"
// etc.
```

## En ComfyDeploy
Cada parámetro que necesites controlar se expone como un nodo `ComfyUIDeployExternalText` con el mismo nombre como `input_id`.
