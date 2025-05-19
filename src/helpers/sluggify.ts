export function sluggify(input: string) {
    return input.toLowerCase().replaceAll(' ', '_')
}
